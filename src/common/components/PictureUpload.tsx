import React, { useState } from 'react';
import { Row, Col, Upload, notification, Progress, Button, Typography } from 'antd';
import type { UploadChangeParam } from 'antd/lib/upload';
import type { UploadFile, RcFile } from 'antd/lib/upload/interface';
import { UploadOutlined } from '@ant-design/icons';

interface ResourceModel {
  path: string;
  url: string;
}

/**
 * 上传时候获得的数据
 */
interface MyUploadFile extends UploadFile<any> {
  path: string;
}

/**
 * 已上传的文件，信息可能没这么多啊
 */
interface UploadedFile extends ResourceModel, Partial<UploadFile<any>> {
  url: string;
}

export function toApiLevelResource(input: any) {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  return (input as UploadedFile).path;
}

interface PictureUploadProps {
  action: string;
  /**
   * 图片要求的尺寸规格
   */
  requiredImageSize?: {
    width: number;
    height: number;
  };
  /**
   * 显示信息
   */
  warningMessage?: string;
  /**
   * 支持多个文件么？默认 1
   */
  maxFileSize?: number;
  value?: UploadedFile | UploadedFile[];
  /**
   * 一般只要path
   */
  onChange?: (value: any) => void;
  // currentImage?: any;
  // formInstance?: FormInstance | undefined;
  // formInstanceRef?: React.MutableRefObject<FormInstance | undefined>;
}

export const imageTypes = ['bmp', 'png', 'gif', 'jpg', 'jpeg'];

function toMediaType(name: string) {
  const type = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
  if (imageTypes.includes(type)) return `image/${type}`;
  return `unknown/${type}`;
}

function toFileList(value?: UploadedFile | UploadedFile[]): MyUploadFile[] {
  // console.log('input value:', value);
  if (!value) return [];
  const toFile: (v: UploadedFile) => MyUploadFile = (v) => {
    return {
      ...v,
      // thumbUrl: v.thumbUrl || v.url,
      // preview: v.preview || v.url,
      uid: v.uid || v.path,
      size: v.size || 0,
      name: v.name || v.path,
      type: v.type || toMediaType(v.path),
    };
  };
  if (Array.isArray(value)) {
    return value.map(toFile);
  }
  return [toFile(value)];
}

const PictureUpload: React.FC<PictureUploadProps> = ({
  action,
  warningMessage,
  requiredImageSize: requiredSize,
  value,
  maxFileSize,
  onChange,
}) => {
  const max = maxFileSize || 1;
  // const [previewImageData, setPreviewImageData] = useState(
  //   currentImage == null ? emptyImage : currentImage,
  // );
  const [fileList, setFileList] = useState<MyUploadFile[]>(toFileList(value));
  const [up, setUp] = useState(false);
  const [percent, setPercent] = useState<number>();
  const [illegalImageSize, setIllegalImageSize] = useState(false);

  const removing = (file: UploadFile) => {
    // console.log('delete:', file);
    const newList = fileList.filter((it) => it.uid !== file.uid);
    // TODO: 远程删除？
    setFileList(newList);
    if (onChange != null) {
      if (max === 1) {
        // console.log('传出：', newList[0]);
        onChange(undefined);
      } else {
        // console.log('传出：', newList);
        onChange(newList);
      }
    }
  };

  const uploading = (info: UploadChangeParam<UploadFile<any>>) => {
    if (info.file.status === 'done') {
      setUp(false);
      // console.log('file:', info.file);
      // console.log('files:', info.fileList);
      const newList = info.fileList.map((it) => {
        if (it.uid === info.file.uid) {
          return {
            ...it,
            path: info.file.response.path,
            url: info.file.response.previewUrl,
            // thumbUrl: info.file.response.previewUrl,
          };
        }
        return it as MyUploadFile;
      });
      setFileList(newList);
      if (onChange != null) {
        if (max === 1) {
          // console.log('传出：', newList[0]);
          onChange(newList[0]);
        } else {
          // console.log('传出：', newList);
          onChange(newList);
        }
      }
    } else if (info.file.status === 'error') {
      setUp(false);
      setFileList(info.fileList as MyUploadFile[]);
      // console.log('info.file', info.file);
      // console.log('info.fileList', info.fileList);
      if (illegalImageSize)
        notification.error({
          message: `图片尺寸不符合要求，建议使用${requiredSize?.width}*${requiredSize?.height}`,
        });
      else
        notification.error({
          message: '文件上传错误',
        });
    } else if (info.file.status === 'removed') {
      setFileList(info.fileList as MyUploadFile[]);
    } else {
      // console.log('other status?', info.file);
      setFileList(info.fileList as MyUploadFile[]);
      setPercent(info.file.percent);
      setUp(true);
    }
  };

  const transformFile = requiredSize
    ? (file: RcFile): Promise<Blob> => {
        setIllegalImageSize(false);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            // const canvas = document.createElement('canvas',{});
            const img = document.createElement('img');
            img.src = reader.result as string;
            img.onload = () => {
              if (img.width / img.height !== requiredSize.width / requiredSize.height) {
                setIllegalImageSize(true);
                reject(new Error('尺寸不正确'));
                // throw new Error('尺寸不正确');
              } else {
                resolve(file);
                // const ctx = canvas.getContext('2d')!!;
                // ctx.drawImage(img, 0, 0);
                // 水印
                // ctx.fillStyle = 'red';
                // ctx.textBaseline = 'middle';
                // ctx.fillText('Ant Design', 20, 20);
                // canvas.toBlob(resolve);
              }

              // resolve(img)
            };
          };
        });
      }
    : undefined;

  // eslint-disable-next-line no-nested-ternary
  const message =
    warningMessage ||
    (requiredSize ? `图片尺寸规格：${requiredSize.width}*${requiredSize.height}` : null);
  return (
    <>
      {message ? (
        <Row>
          <Col span={24}>
            <Typography.Text strong style={{ color: 'red' }}>
              {message}
            </Typography.Text>
          </Col>
        </Row>
      ) : null}
      {up && !!percent ? (
        <Row>
          <Col span={24}>
            <Progress percent={percent} />
          </Col>
        </Row>
      ) : null}
      <Row>
        <Col span={24}>
          <Upload
            beforeUpload={transformFile}
            onChange={uploading}
            onRemove={removing}
            name="data"
            action={action}
            accept={imageTypes.map((it) => `.${it}`).join(',')}
            withCredentials
            showUploadList
            listType="picture-card"
            // listType="picture" // 显示了不该显示的 name 太丑了
            fileList={fileList}
          >
            {max > fileList.length ? (
              <Button loading={up}>
                <UploadOutlined />
              </Button>
            ) : null}
          </Upload>
        </Col>
      </Row>
    </>
  );
};

export default PictureUpload;
