interface TextMessageProps {
  content: string;
}

export default function TextMessage({ content }: TextMessageProps) {
  return (
    <div className="message-text">{content}</div>
  );
}
