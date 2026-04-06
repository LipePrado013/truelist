import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Item = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
};

function SelectEmployee() {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [error, setError] = useState("");

  const pdfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedItems = localStorage.getItem("items");
    if (savedItems) setItems(JSON.parse(savedItems));
  }, []);

  useEffect(() => {
    localStorage.setItem("items", JSON.stringify(items));
  }, [items]);

  function formatKg(value: string): string | null {
    const cleaned = value.replace(",", ".");
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return num.toFixed(3);
  }

  function handleAddOrEditItem() {
    setError("");

    if (!name.trim()) {
      setError("Digite o nome do item");
      return;
    }

    if (!quantity.trim()) {
      setError("Digite a quantidade");
      return;
    }

    if (!unit) {
      setError("Selecione a unidade");
      return;
    }

    const normalizedName = name.trim().toLowerCase();

    const alreadyExists = items.some(
      (item) =>
        item.name.trim().toLowerCase() === normalizedName &&
        item.id !== editingItem?.id,
    );

    if (alreadyExists) {
      setError("Este item já existe");
      return;
    }

    let finalQuantity = quantity;

    if (unit === "kg") {
      const formatted = formatKg(quantity);
      if (!formatted) {
        setError("Kg inválido (ex: 1,500)");
        return;
      }
      finalQuantity = formatted;
    } else {
      if (!/^\d+$/.test(quantity)) {
        setError("Use número inteiro (ex: 1, 2, 3)");
        return;
      }
    }

    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: name.trim(), quantity: finalQuantity, unit }
            : item,
        ),
      );
      setEditingItem(null);
    } else {
      setItems([
        ...items,
        {
          id: Date.now(),
          name: name.trim(),
          quantity: finalQuantity,
          unit,
        },
      ]);
    }

    setName("");
    setQuantity("");
    setUnit("");
    setShowModal(false);
  }

  function handleDelete(id: number) {
    const confirmDelete = window.confirm("Tem certeza que deseja apagar?");
    if (!confirmDelete) return;

    setItems(items.filter((item) => item.id !== id));
    setSelectedItems(selectedItems.filter((i) => i !== id));
  }

  function handleEdit(item: Item) {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setShowModal(true);
  }

  function toggleSelect(id: number) {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function generatePDF() {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current);
    const data = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(data, "PNG", 0, 0, width, height);
    pdf.save("lista-de-compras.pdf");
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedList = items.filter((item) => selectedItems.includes(item.id));

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-lg">
          <div className="flex justify-center items-center h-16 bg-blue-600">
            <h1 className="text-white text-xl font-semibold">
              Lista de compras
            </h1>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <input
              placeholder="Pesquisar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#efefef] p-3 rounded-xl"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowModal(true);
                  setEditingItem(null);
                  setName("");
                  setQuantity("");
                  setUnit("");
                  setError("");
                }}
                className="flex-1 bg-blue-600 text-white p-2 rounded-xl"
              >
                + Item
              </button>

              <button
                onClick={() => setShowPreview(true)}
                className="flex-1 bg-red-500 text-white p-2 rounded-xl"
              >
                PDF
              </button>
            </div>

            {filteredItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex justify-between p-3 rounded-xl cursor-pointer ${
                    isSelected ? "bg-blue-100" : "bg-[#efefef]"
                  }`}
                >
                  <div className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div>
                      <p>{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-5 rounded-2xl flex flex-col gap-4 w-[90%] max-w-sm">
            <h2 className="text-lg font-semibold">
              {editingItem ? "Editar Item" : "Novo Item"}
            </h2>

            <input
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#efefef] p-2 rounded-xl"
            />

            <input
              placeholder={unit === "kg" ? "Ex: 1,500" : "Ex: 1, 2, 3"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-[#efefef] p-2 rounded-xl"
            />

            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="bg-[#efefef] p-2 rounded-xl"
            >
              <option value="">Selecione a unidade</option>
              <option value="kg">Kg</option>
              <option value="lata">Lata</option>
              <option value="saco">Saco</option>
              <option value="cx">Cx</option>
              <option value="un">Un</option>
              <option value="pcs">Pcs</option>
            </select>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 p-2 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={handleAddOrEditItem}
                className="flex-1 bg-blue-600 text-white p-2 rounded-xl"
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
          <div className="bg-white p-5 rounded-2xl w-[90%] max-w-md flex flex-col gap-4">
            <div ref={pdfRef} className="p-4 border rounded-xl">
              <h2 className="text-center font-bold mb-4 border-b pb-2">
                Lista de Compras
              </h2>

              {selectedList.length === 0 ? (
                <p className="text-center text-gray-400">
                  Nenhum item selecionado
                </p>
              ) : (
                selectedList.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-2 border-b"
                  >
                    <span>{item.name}</span>
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-300 p-2 rounded-xl"
              >
                Fechar
              </button>

              <button
                onClick={generatePDF}
                className="flex-1 bg-green-500 text-white p-2 rounded-xl"
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
