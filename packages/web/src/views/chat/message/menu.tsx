interface MessageMenuProps {
  visible: boolean;
}

export default function MessageMenu() {
  return (
    <dialog open className="dialog">
      <menu className="dialog__content">
        <li>text 1</li>
        <li>text 2</li>
        <li>text 3</li>
      </menu>
    </dialog>
  );
}
