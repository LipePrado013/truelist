import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Tipo do item
type Item = {
  id: number;
  name: string;
  quantity: string;
};

function SelectEmployee() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const pdfRef = useRef<HTMLDivElement | null>(null);

  // 🔥 CARREGAR DO LOCALSTORAGE
  useEffect(() => {
    const savedItems = localStorage.getItem("items");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // 🔥 SALVAR NO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("items", JSON.stringify(items));
  }, [items]);

  function handleAddOrEditItem(): void {
    if (!name || !quantity) return;

    if (editingItem) {
      const updatedItems = items.map((item) =>
        item.id === editingItem.id ? { ...item, name, quantity } : item,
      );
      setItems(updatedItems);
      setEditingItem(null);
    } else {
      const newItem: Item = {
        id: Date.now(),
        name,
        quantity,
      };
      setItems([...items, newItem]);
    }

    setName("");
    setQuantity("");
    setShowModal(false);
  }

  function handleDelete(id: number): void {
    setItems(items.filter((item) => item.id !== id));
  }

  function handleEdit(item: Item): void {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setShowModal(true);
  }

  async function generatePDF(): Promise<void> {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current);
    const data = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("lista-de-compras.pdf");
  }

  // 🔍 FILTRO
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-lg">
          {/* Header */}
          <div className="flex justify-center items-center h-16 bg-blue-600 shadow">
            <h1 className="text-white text-xl font-semibold">
              Lista de compras
            </h1>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {/* 🔍 Pesquisa */}
            <input
              type="text"
              placeholder="Pesquisar item..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="border p-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />

            {/* Ações */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setName("");
                  setQuantity("");
                  setShowModal(true);
                }}
                className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 active:scale-95 transition"
              >
                + Item
              </button>

              <button
                onClick={() => setShowPreview(true)}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold shadow hover:bg-red-600 active:scale-95 transition"
              >
                PDF
              </button>
            </div>

            {/* Lista */}
            {filteredItems.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">
                Nenhum item encontrado...
              </p>
            )}

            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Quantidade: {item.quantity}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 text-sm font-medium hover:underline"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL ITEM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white w-[90%] max-w-sm p-5 rounded-2xl shadow-xl flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingItem ? "Editar Item" : "Novo Item"}
            </h2>

            <input
              type="text"
              placeholder="Nome do item"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              className="border p-2 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <input
              type="number"
              placeholder="Quantidade"
              value={quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuantity(e.target.value)
              }
              className="border p-2 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-10 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleAddOrEditItem}
                className="flex-1 h-10 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW PDF */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[90%] max-w-md p-5 rounded-2xl shadow-xl flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Preview do PDF
            </h2>

            <div
              ref={pdfRef}
              className="bg-white p-4 border rounded-xl shadow-inner"
            >
              <h3 className="text-xl font-bold mb-3 text-center">
                Lista de Compras
              </h3>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border-b py-2 text-sm"
                >
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 h-10 bg-gray-200 rounded-xl font-medium hover:bg-gray-300"
              >
                Fechar
              </button>

              <button
                onClick={generatePDF}
                className="flex-1 h-10 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600"
              >
                Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SelectEmployee;
