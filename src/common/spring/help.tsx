import Authorized from '@/components/Authorized/Authorized';
import type { IAuthorityType } from '@/components/Authorized/CheckPermissions';
import { PlusCircleFilled } from '@ant-design/icons';
import type { ProFormProps, QueryFilterProps } from '@ant-design/pro-form';
import type { ActionType, ProColumns, ProTableProps } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import type { ModalProps } from 'antd';
import { Popconfirm } from 'antd';
import { Divider } from 'antd';
import { Button, Modal } from 'antd';
import { isArray } from 'lodash';
import React, { useRef, useState } from 'react';
import { findModifiedFieldsAsObject } from '../dataHelper';
import { handleWithMessage } from '../message';
import type { AntDesignPage } from './antd';
import { requestPage } from './antd';
import type { HalRestResourceModel } from './hal';
import { toHalResourceSelfHref } from './hal';

type EditableProps<T> = {
  /**
   * 可供编辑的字段
   */
  editableFields?: string[];
  /**
   * 提交前的预处理器
   * type 0 -> 新增 1 -> 修改
   */
  preValueHandler?: (input: Record<string, any>, type: number) => Record<string, any> | undefined;
  /**
   * 修改完成之后的回调
   */
  onEditCommitted?: (entity: T) => any | undefined;
};

/**
 * 可作为 creatable 的数据
 */
type CreatableType = boolean | JSX.Element;

type QuickCrudProps<
  T extends HalRestResourceModel,
  U extends Record<string, any> = Record<string, any>,
  ValueType = 'text',
> = Omit<ProTableProps<T, U, ValueType>, 'editable'> &
  EditableProps<T> & {
    /**
     * 新增所需权限
     */
    addAuthority?: IAuthorityType;
    /**
     * 是否可以创建新的对象
     * 如果对象是一个元素则就以此渲染新增的 Button
     */
    creatable?:
      | CreatableType
      | ((actionRef: React.MutableRefObject<ActionType | undefined>) => CreatableType);

    /**
     *  自动创建的 新增modal 的额外属性
     */
    createModalProps?: ModalProps & {
      table?: Omit<ProTableProps<T, U, ValueType>, 'columns' | 'type' | 'onSubmit'>;
    };

    /**
     * 数据在准备到 table 之前的再处理
     */
    dataPoster?: (page: AntDesignPage<T>) => Promise<AntDesignPage<T>> | AntDesignPage<T>;
    /**
     *  修改和删除所需权限
     */
    editAuthority?: IAuthorityType;
    /**
     *  是否渲染编辑按钮
     */
    editable?: (entity: T) => boolean;
    /**
     *  编辑modal 的额外属性，如果传入了该字段即便是空对象，也抛弃了原有的行编辑模式，使用modal进行编辑。
     *  TODO: 如果采用了该模式，那么就无法删除了噢？
     */
    editModalProps?: ModalProps & {
      table?: Omit<ProTableProps<T, U, ValueType>, 'columns' | 'type' | 'onSubmit'>;
    };
    /**
     *  获取数据时固定的参数
     */
    fixedRequestParameters?: any;
  };

/**
 *
 * @param prior 之前数据的获取方法
 * @param props 必要的一些数据
 * @returns 一个onSave的方法
 */
export function onSaveGenerator<T extends HalRestResourceModel>(
  prior: (key: React.Key | React.Key[]) => any,
  props: EditableProps<T> & {
    /**
     * 列模式，接收到的key为字段名
     */
    columnMode?: boolean;
  },
):
  | ((
      key: React.Key | React.Key[],
      row: T & {
        index?: number | undefined;
      },
      // newLineConfig?: NewLineConfig<T> | undefined,
    ) => Promise<any>)
  | undefined {
  const { editableFields, preValueHandler, onEditCommitted, columnMode = false } = props;
  return async (key, entity) => {
    const href = toHalResourceSelfHref(entity);
    const fields = columnMode ? [key as string] : editableFields;
    // 这里需要考虑到一个事儿 就是key 会在不同的环境下 传入不同的数据
    // 在ProTable 中 是 主键（针对行）， 在 ProDescriptions 中则是 列名（针对列)
    if (!fields) return;
    const ci = findModifiedFieldsAsObject(entity, prior(href), fields);
    // console.log(ci);
    if (!ci) {
      // change nothing
      return;
    }
    const commit = preValueHandler ? preValueHandler?.(ci, 1) : ci;
    if (!commit) return;
    await handleWithMessage(href, {
      method: 'PATCH',
      data: commit,
    });
    onEditCommitted?.(entity);
  };
}

/**
 *
 * @param api 操作路径
 * @param creatable 是否可以创建新的对象
 * @param editableFields 可供编辑的字段
 * @param defaultProps 其他带入属性
 */
export function useQuickCrud<
  T extends HalRestResourceModel,
  U extends Record<string, any> = Record<string, any>,
  ValueType = 'text',
>(
  api: string,
  // creatable: boolean = true,
  // editableFields: string[] | undefined = undefined,
  // defaultProps: ProTableProps<T, U, ValueType> | undefined = undefined,
  params: QuickCrudProps<T, U, ValueType> | undefined = undefined,
) {
  const [creation, setCreation] = useState(false);
  const [editing, setEditing] = useState<T>();
  const [dataSource, setDataSource] = useState<T[]>([]);
  const actionRef = useRef<ActionType>();

  const {
    toolBarRender,
    creatable: inputCB = true,
    createModalProps,
    editableFields = undefined,
    editable,
    editModalProps,
    onEditCommitted,
    preValueHandler,
    dataPoster,
    addAuthority,
    editAuthority,
    fixedRequestParameters,
  } = params || {};
  const creatable = typeof inputCB === 'function' ? inputCB(actionRef) : inputCB;
  const newToolBarRender = creatable
    ? (action: any, rows: any) => {
        const button =
          typeof creatable === 'boolean' ? (
            <Button type="primary" key="add" onClick={() => setCreation(true)}>
              <PlusCircleFilled />
            </Button>
          ) : (
            creatable
          );
        const bt = addAuthority ? (
          <Authorized key="add" authority={addAuthority} noMatch={<span />}>
            {button}
          </Authorized>
        ) : (
          button
        );
        if (toolBarRender) {
          // 原来有 先调用
          const os = toolBarRender(action, rows);
          os.unshift(bt);
          return os;
        }
        return [bt];
      }
    : toolBarRender;

  const props: ProTableProps<T, U, ValueType> = {
    ...params,
    actionRef,
    request: (ps, sort, filter) =>
      requestPage<T>(api, { ...fixedRequestParameters, ...ps, sort, filter }).then((rs) =>
        dataPoster ? dataPoster(rs) : rs,
      ),
    rowKey: toHalResourceSelfHref,
    toolBarRender: newToolBarRender,
    onDataSourceChange: (ds) => setDataSource(ds),
    editable:
      editableFields && !editModalProps
        ? {
            onDelete: async (key) => {
              handleWithMessage(key as string, { method: 'DELETE' });
            },
            onSave: onSaveGenerator(
              (key) => dataSource.find((it) => toHalResourceSelfHref(it) === key),
              { editableFields, preValueHandler, onEditCommitted },
            ),
          }
        : undefined,
  };

  const createModal = (columns: ProColumns<T, ValueType>[]) => {
    const fc = creatable ? (
      <Modal
        destroyOnClose
        title="新增"
        width="400px"
        visible={creation}
        onCancel={() => setCreation(false)}
        footer={false}
        {...createModalProps}
      >
        <ProTable<T, U, ValueType>
          {...createModalProps?.table}
          columns={columns}
          type="form"
          onSubmit={(ps) => {
            const commit = preValueHandler ? preValueHandler?.(ps, 0) : ps;
            if (!commit) return;
            handleWithMessage(api, {
              method: 'POST',
              data: commit,
              actionTypeRef: actionRef,
              onSuccess: () => setCreation(false),
            });
          }}
        ></ProTable>
      </Modal>
    ) : null;
    // 编辑，只有在..
    const fe =
      editModalProps && editableFields ? (
        <Modal
          destroyOnClose
          title="编辑"
          width="400px"
          visible={!!editing}
          onCancel={() => setEditing(undefined)}
          footer={false}
          {...editModalProps}
        >
          <ProTable<T, U, ValueType>
            // 只有哪些需要编辑的字段才可以出现
            columns={editColumns(columns, editableFields)}
            {...mergeForm(editModalProps?.table, {
              initialValues: editing,
            })}
            type="form"
            onSubmit={async (ps) => {
              // 处理编辑
              const ci = findModifiedFieldsAsObject(ps, editing as any, editableFields);
              // console.log(ci);
              if (!ci) {
                // change nothing
                return;
              }
              const commit = preValueHandler ? preValueHandler?.(ci, 1) : ci;
              if (!commit) return;
              await handleWithMessage(toHalResourceSelfHref(editing!!), {
                method: 'PATCH',
                data: commit,
              });
              onEditCommitted?.(ps as T);
              setEditing(undefined);
              actionRef.current?.reload();
            }}
          ></ProTable>
        </Modal>
      ) : null;
    return (
      <>
        {fc}
        {fe}
      </>
    );
  };

  const optionColumn: ProColumns<T, ValueType> | undefined = editableFields
    ? {
        title: '操作',
        valueType: 'option',
        render: (_, entity, __, action) => {
          if (editable && !editable(entity)) return undefined;
          const ele = editModalProps ? (
            <>
              <a onClick={() => setEditing(entity)}>编辑</a>
              <Divider type="vertical" />
              <Popconfirm
                title="确定要删除么？"
                onConfirm={() =>
                  handleWithMessage(toHalResourceSelfHref(entity), {
                    method: 'DELETE',
                    actionTypeRef: actionRef,
                  })
                }
              >
                <a>删除</a>
              </Popconfirm>
            </>
          ) : (
            <a onClick={() => action.startEditable(toHalResourceSelfHref(entity))}>编辑</a>
          );
          return editAuthority ? (
            <Authorized authority={editAuthority} noMatch={<span />}>
              {ele}
            </Authorized>
          ) : (
            ele
          );
        },
      }
    : undefined;

  return {
    props,
    createModal,
    optionColumn,
    actionRef,
  };
}
function editColumns<T extends HalRestResourceModel, ValueType = 'text'>(
  columns: ProColumns<T, ValueType>[],
  editableFields: string[],
): ProColumns<T, ValueType>[] | undefined {
  return columns
    .filter((it) => {
      if (!it.dataIndex) return false;
      return editableFields.some((field) => {
        if (typeof it.dataIndex === 'string') return it.dataIndex === field;
        if (isArray(it.dataIndex)) return it.dataIndex[0] === field;
        return false;
      });
    })
    .map(({ hideInForm, ...it }) => it);
}

function mergeForm<
  T extends HalRestResourceModel,
  U extends Record<string, any> = Record<string, any>,
  ValueType = 'text',
>(
  table: Omit<ProTableProps<T, U, ValueType>, 'columns' | 'onSubmit' | 'type'> | undefined,
  form: Omit<ProFormProps & QueryFilterProps, 'form'>,
): Partial<ProTableProps<T, U, ValueType>> {
  if (!table) {
    return { form };
  }
  const { form: originForm, ...other } = table;
  if (!originForm) {
    return {
      ...other,
      form,
    };
  }
  return {
    ...other,
    form: {
      ...originForm,
      ...form,
    },
  };
}
