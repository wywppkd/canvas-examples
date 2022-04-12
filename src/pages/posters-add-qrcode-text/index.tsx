import generateImgElement from '@/utils/generateImgElement';
import { fabric } from 'fabric';
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import styles from './index.less';

// 学校列表
const schools = [
  {
    schoolName: '北大附属小学',
    signUpLink: '报名链接1',
  },
  {
    schoolName: '北京师范育新校区',
    signUpLink: '报名链接2',
  },
  {
    schoolName: '人大附小',
    signUpLink: '报名链接3',
  },
];

// 批量处理海报
const Index = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [fabricText, setFabricText] = useState<fabric.Text | null>(null);
  const [fabricImage, setFabricImage] = useState<fabric.Image | null>(null);

  useEffect(() => {
    (async () => {
      const imgElement = await generateImgElement(
        'https://images.unsplash.com/photo-1496307653780-42ee777d4833?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=1600&ixid=MnwxfDB8MXxyYW5kb218MHx8d2hpdGV8fHx8fHwxNjQ5NDExNzA3&ixlib=rb-1.2.1&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=750',
      );
      const { naturalHeight, naturalWidth } = imgElement;

      // 根据海报图尺寸生成canvas
      const canvas = new fabric.Canvas(refCanvas.current, {
        width: naturalWidth / 2, // 取背景图尺寸的 1/2
        height: naturalHeight / 2,
        preserveObjectStacking: true, // 点击背景图时避免覆盖其他图层
      });

      const fabricImage = new fabric.Image(imgElement, {
        left: 0,
        top: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: false,
      });

      // 设置海报背景图
      canvas.add(fabricImage);

      setFabricCanvas(canvas);
    })();
  }, []);

  /** 更换二维码内容 -> 重新渲染canvas -> canvas转blob */
  const dataUrlToBlob = (dataUrl: string): Promise<Blob | null> =>
    new Promise((resolve) => {
      if (fabricImage) {
        // 有二维码
        fabricImage.setSrc(dataUrl, () => {
          fabricCanvas?.discardActiveObject()?.renderAll();
          refCanvas.current?.toBlob((blob) => resolve(blob));
        });
      } else {
        // 无二维码
        fabricCanvas?.discardActiveObject()?.renderAll();
        refCanvas.current?.toBlob((blob) => resolve(blob));
      }
    });

  return (
    <div className={styles.wrap}>
      <div>
        <button
          disabled={Boolean(fabricText)}
          onClick={() => {
            const item1 = schools[0];
            const fabricText = new fabric.Text(item1.schoolName);
            fabricCanvas?.add(fabricText);
            fabricCanvas?.renderAll();
            setFabricText(fabricText);
          }}
        >
          添加文案
        </button>
        <button
          disabled={Boolean(fabricImage)}
          onClick={async () => {
            const item1 = schools[0];
            const dataUrl = await QRCode.toDataURL(item1.signUpLink, {
              margin: 0,
              width: 200,
            });
            const imgElement = await generateImgElement(dataUrl);
            const fabricImage = new fabric.Image(imgElement);
            fabricCanvas?.add(fabricImage);
            fabricCanvas?.renderAll();
            setFabricImage(fabricImage);
          }}
        >
          添加二维码
        </button>
        <button
          title="批量替换标题和二维码内容, 并压缩zip包后下载"
          onClick={async () => {
            const jszip = new JSZip();
            // 创建压缩包目录
            const imagesFolder = jszip.folder('images');

            for (const item of schools) {
              if (fabricText) {
                const origin = fabricText?.getPointByOrigin('center', 'center');
                fabricText?.set('text', item.schoolName);
                fabricText?.setPositionByOrigin(origin, 'center', 'center');
                fabricText?.set('textAlign', 'center');
              }

              // 链接转二维码
              const dataUrl = await QRCode.toDataURL(item.signUpLink, {
                margin: 0,
                width: fabricImage?.getOriginalSize().width, // 二维码实际尺寸
              });

              const blob = await dataUrlToBlob(dataUrl);
              if (blob) {
                // 将海报放在指定目录
                imagesFolder?.file(`${item.schoolName}招生海报.jpg`, blob);
              }
            }

            const blobZip = await imagesFolder?.generateAsync({ type: 'blob' });
            if (blobZip) {
              saveAs(blobZip, 'posters.zip');
            }
          }}
        >
          批量下载海报
        </button>
      </div>
      <canvas ref={refCanvas} />
    </div>
  );
};

export default Index;
