export const enum MailType {
  text = 'text',
  long_text = 'long_text',
  file = 'file',
}

/**
 * User. Identity by cookie
 */
export type User = Readonly<{
  id: string;
  user_name: string;
}>;

/**
 * File struct
 */
export type FileObject = Readonly<{
  isPreSend: boolean;
  id: string; // 文件 ID
  name: string; // 文件名
  size: number; // 大小, bytes
}>;

export type MailDataOutline = Readonly<{
  type: MailType;
  content: string;
}>;

/**
 * Mail struct
 */
export type MailData = Readonly<{
  type: MailType.text;
  content: string;
} | {
  type: MailType.file | MailType.long_text;
  content: FileObject;
}>;

/**
 * Mail that sent to server
 */
export type MailSend = Readonly<{
  /** unique ID for client render */
  id: string;
  /** receivers ID */
  receivers: readonly string[];
  /** the mail body */
  data: MailDataOutline;
}>;

export type MailSendDetailed = Omit<MailSend, 'data'> & Readonly<{
  data: MailData;
}>;

/**
 * Mail that received from server
 */
export type MailReceive = Readonly<{
  id: string;
  /** unix milliseconds */
  create_date: number;
  /** sender ID */
  sender: string;
  /** the mail body */
  data: MailData;
}>;
