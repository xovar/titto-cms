import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from "../../store/slices/outletSlice";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function Outlets() {
  const dispatch = useDispatch();
  const { items: outlets, loading, updating } = useSelector(
    (state) => state.outlets
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [outletName, setOutletName] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    dispatch(fetchOutlets());
  }, [dispatch]);

  const handleOpenModal = (outlet = null) => {
    if (outlet) {
      setEditingOutlet(outlet);
      setOutletName(outlet.outlet_name);
    } else {
      setEditingOutlet(null);
      setOutletName("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOutlet(null);
    setOutletName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outletName.trim()) {
      toast.error("Please enter an outlet name");
      return;
    }

    if (editingOutlet) {
      const res = await dispatch(
        updateOutlet({
          id: editingOutlet.outlet_id,
          outlet_name: outletName.trim(),
        })
      );
      if (updateOutlet.fulfilled.match(res)) {
        toast.success("Outlet updated successfully!");
        handleCloseModal();
      } else {
        toast.error(res.payload || "Failed to update outlet");
      }
    } else {
      const res = await dispatch(
        createOutlet({ outlet_name: outletName.trim() })
      );
      if (createOutlet.fulfilled.match(res)) {
        toast.success("Outlet created successfully!");
        handleCloseModal();
      } else {
        toast.error(res.payload || "Failed to create outlet");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this outlet?")) {
      setDeleteId(id);
      const res = await dispatch(deleteOutlet(id));
      setDeleteId(null);
      if (deleteOutlet.fulfilled.match(res)) {
        toast.success("Outlet deleted successfully!");
      } else {
        toast.error(res.payload || "Failed to delete outlet");
      }
    }
  };

  const filteredOutlets = (outlets || []).filter((item) =>
    item.outlet_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="text-blue-600" size={24} />
            Outlets Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your store outlets and locations.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer shadow-xs"
        >
          <Plus size={16} />
          Add New Outlet
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        {/* Search Bar - Clean & Properly Aligned */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search outlets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table / Loading / Empty States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="animate-spin mb-2 text-blue-600" size={28} />
            <p className="text-xs">Loading outlets...</p>
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <Store size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No outlets found
            </p>
            <p className="text-xs mt-1">
              {searchTerm
                ? "Try searching with a different term"
                : "Click 'Add New Outlet' to create your first outlet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Outlet Name</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filteredOutlets.map((outlet) => (
                  <tr
                    key={outlet.outlet_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono text-xs text-slate-400 dark:text-slate-500">
                      #{outlet.outlet_id}
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-700 dark:text-slate-200">
                      {outlet.outlet_name}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(outlet)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Outlet"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(outlet.outlet_id)}
                          disabled={deleteId === outlet.outlet_id}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete Outlet"
                        >
                          {deleteId === outlet.outlet_id ? (
                            <Loader2 className="animate-spin text-red-600" size={15} />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                {editingOutlet ? "Edit Outlet" : "Add New Outlet"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Outlet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhanmondi Branch"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {updating && <Loader2 className="animate-spin" size={15} />}
                  {editingOutlet ? "Update Outlet" : "Save Outlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}