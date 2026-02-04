import MenuUploader from "./MenuUploader";

export default function Page() {
  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Upload меню (.xlsx)</h1>
      <MenuUploader />
    </main>
  );
}
