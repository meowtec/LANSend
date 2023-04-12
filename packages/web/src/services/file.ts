import useSWRImmutable from 'swr/immutable';
import { parseJSON } from '#/utils/utils';
import { isResponseOk, Response, requestText } from '#/utils/request';
import { FileObject } from '../types';

interface UploadFileParams {
  /** progress 1-100 */
  onProgress: (progress: number) => void;
  onSuccess: (file: FileObject) => void;
  onFail: (error: Error) => void;
}

const preLongTextDict: Record<string, string> = {};

export function addPreLongText(id: string, text: string) {
  preLongTextDict[id] = text;
}

export function uploadFile(file: File, { onProgress, onSuccess, onFail }: UploadFileParams) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `/api/file/upload?filename=${encodeURIComponent(file.name)}`);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      onProgress(percentComplete);
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const res = parseJSON<Response<FileObject>>(xhr.responseText);
      if (res && isResponseOk(res)) {
        onProgress(100);
        onSuccess(res.data);
        return;
      }
    }

    onFail(new Error('Upload failed'));
  };

  xhr.send(file);
}

export function useLongText(fileId: string | null) {
  return useSWRImmutable<string>(
    fileId ? `/api/file/${fileId}` : null,
    fileId ? (url: string) => preLongTextDict[fileId] ?? requestText(url) : null,
  );
}
