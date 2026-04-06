import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

type Item = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  category: string;
};

const categories = [
  "Sushi",
  "Bebidas",
  "Vinhos",
  "Frutas",
  "Sobremesas",
  "Limpeza",
  "Outros",
  "Mercado chinês",
];

function SelectEmployee() {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [error, setError] = useState("");

  const previewRef = useRef<HTMLDivElement | null>(null);

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

    if (!name.trim() || !quantity.trim() || !unit || !category) {
      setError("Preencha todos os campos");
      return;
    }

    let finalQuantity = quantity;

    if (unit === "kg") {
      const formatted = formatKg(quantity);
      if (!formatted) {
        setError("Kg inválido");
        return;
      }
      finalQuantity = formatted;
    } else {
      if (!/^\d+$/.test(quantity)) {
        setError("Use número inteiro");
        return;
      }
    }

    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: name.trim(),
                quantity: finalQuantity,
                unit,
                category,
              }
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
          category,
        },
      ]);
    }

    setName("");
    setQuantity("");
    setUnit("");
    setCategory("");
    setShowModal(false);
  }

  function handleDelete(id: number) {
    if (!window.confirm("Tem certeza que deseja apagar?")) return;
    setItems(items.filter((item) => item.id !== id));
    setSelectedItems(selectedItems.filter((i) => i !== id));
  }

  function handleDeleteSelected() {
    if (selectedItems.length === 0) {
      alert("Nenhum item selecionado");
      return;
    }

    if (!window.confirm("Apagar itens selecionados?")) return;

    setItems(items.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  }

  function handleEdit(item: Item) {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setCategory(item.category);
    setShowModal(true);
  }

  function toggleSelect(id: number) {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  function selectAll() {
    setSelectedItems(items.map((item) => item.id));
  }

  function clearSelection() {
    setSelectedItems([]);
  }

  async function generateImage() {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = "lista-de-compras.jpg";
    link.href = canvas.toDataURL("image/jpeg", 1.0);
    link.click();
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
              className="bg-[#efefef] p-3 rounded-xl outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowModal(true);
                  setEditingItem(null);
                  setName("");
                  setQuantity("");
                  setUnit("");
                  setCategory("");
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
                Exportar
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="flex-1 bg-green-500 text-white p-2 rounded-xl"
              >
                Selecionar tudo
              </button>
              <button
                onClick={clearSelection}
                className="flex-1 bg-gray-400 text-white p-2 rounded-xl"
              >
                Desmarcar
              </button>
            </div>

            {/* 🔥 BOTÃO COM CONTADOR */}
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white text-sm px-3 py-1 rounded-lg self-end"
            >
              Apagar selecionados ({selectedItems.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex justify-between items-center p-3 rounded-xl cursor-pointer ${
                    isSelected ? "bg-blue-100" : "bg-[#efefef]"
                  }`}
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.unit} | {item.category}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                      className="text-blue-600 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="text-red-500 text-sm"
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

      {/* PREVIEW */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-5 rounded-2xl w-[90%] max-w-md flex flex-col gap-4">
            <div ref={previewRef} className="p-4 bg-white rounded-xl">
              <h2 className="text-center font-bold mb-4">Lista de Compras</h2>

              {categories.map((cat) => {
                const group = selectedList.filter((i) => i.category === cat);
                if (group.length === 0) return null;

                return (
                  <div key={cat} className="mb-4">
                    <h3 className="font-bold border-b flex justify-between">
                      <span>{cat}</span>
                      <span>{group.length} itens</span>
                    </h3>

                    {group.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>{item.name}</span>
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* 🔥 TOTAL GERAL */}
              <div className="mt-4 border-t pt-2 font-bold flex justify-between">
                <span>Total geral</span>
                <span>{selectedList.length} itens</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-300 p-2 rounded-xl"
              >
                Fechar
              </button>

              <button
                onClick={generateImage}
                className="flex-1 bg-green-500 text-white p-2 rounded-xl"
              >
                Baixar JPG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SelectEmployee;
