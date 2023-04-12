import mime from 'mime';
import iconFileAudio from '#/assets/icons/file-audio.svg';
import iconFileCode from '#/assets/icons/file-code.svg';
import iconFileExcel from '#/assets/icons/file-excel.svg';
import iconFileImage from '#/assets/icons/file-image.svg';
import iconFileLines from '#/assets/icons/file-lines.svg';
import iconFilePDF from '#/assets/icons/file-pdf.svg';
import iconFilePPT from '#/assets/icons/file-powerpoint.svg';
import iconFileVideo from '#/assets/icons/file-video.svg';
import iconFileWord from '#/assets/icons/file-word.svg';
import iconFileZipper from '#/assets/icons/file-zipper.svg';
import iconFile from '#/assets/icons/file.svg';

const iconExtsDict = {
  [iconFileCode]: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'css',
    'html',
    'htm',
    'json',
    'java',
    'py',
    'go',
    'c',
    'cpp',
    'h',
    'hpp',
    'sh',
    'bat',
    'php',
    'xml',
    'yml',
    'yaml',
  ],
  [iconFileExcel]: [
    'xls',
    'xlsx',
    'csv',
  ],
  [iconFilePDF]: [
    'pdf',
  ],
  [iconFilePPT]: [
    'ppt',
    'pptx',
  ],
  [iconFileWord]: [
    'doc',
    'docx',
  ],
  [iconFileZipper]: [
    'zip',
    'rar',
    '7z',
    'tar',
    'gz',
  ],
  [iconFileLines]: [
    'txt',
    'md',
    'log',
  ],
};

const extIconDict = Object.entries(iconExtsDict).reduce((acc, [icon, exts]) => {
  exts.forEach((ext) => {
    acc[ext] = icon;
  });
  return acc;
}, {} as Record<string, string>);

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const type = mime.getType(filename) ?? 'application/octet-stream';
  const [mainType] = type.split('/');

  switch (mainType) {
    case 'image':
      return iconFileImage;
    case 'audio':
      return iconFileAudio;
    case 'video':
      return iconFileVideo;
    default:
  }

  return extIconDict[ext] || iconFile;
}
