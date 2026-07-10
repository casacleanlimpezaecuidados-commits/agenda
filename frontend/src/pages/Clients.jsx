import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Phone,
  MapPin,
  Mail,
  Edit3,
  Trash2,
  X,
  Check,
  Star,
  Navigation,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  // Modal de cliente (criar/editar)
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: 'MG',
    notes: '',
  });

  // Endereços durante o cadastro/edição
  const [formAddresses, setFormAddresses] = useState([]);
  const [showAddressSection, setShowAddressSection] = useState(true);
  
  // Novo endereço sendo preenchido
  const [newAddress, setNewAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    reference: '',
    daysOfWeek: [],
  });

  // Modal de endereços (para cliente já existente)
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, [search, filterActive]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients', {
        params: { search, active: filterActive }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== ADICIONAR ENDEREÇO NA LISTA DO FORMULÁRIO ==========
  const addAddressToForm = () => {
    if (!newAddress.street.trim()) {
      showNotification('❌ O endereço é obrigatório', 'error');
      return;
    }

    // Verificar duplicidade
    const duplicate = formAddresses.find(a =>
      a.street.toLowerCase().trim() === newAddress.street.toLowerCase().trim()
    );
    if (duplicate) {
      showNotification('❌ Este endereço já foi adicionado', 'error');
      return;
    }

    setFormAddresses([...formAddresses, { ...newAddress }]);
    setNewAddress({ street: '', neighborhood: '', city: '', reference: '', daysOfWeek: [] });
  };

  // Remover endereço da lista
  const removeAddressFromForm = (index) => {
    setFormAddresses(formAddresses.filter((_, i) => i !== index));
  };

  // Alternar dia da semana
  const toggleDay = (day) => {
    const days = [...newAddress.daysOfWeek];
    if (days.includes(day)) {
      setNewAddress({ ...newAddress, daysOfWeek: days.filter(d => d !== day) });
    } else {
      setNewAddress({ ...newAddress, daysOfWeek: [...days, day] });
    }
  };

  // ========== CRIAR/EDITAR CLIENTE ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.phone.trim()) {
      showNotification('❌ Nome e telefone são obrigatórios', 'error');
      return;
    }

    setSaving(true);

    try {
      if (editingClient) {
        // Atualizar cliente existente
        await api.put(`/clients/${editingClient._id}`, form);
        showNotification('✅ Cliente atualizado com sucesso!');
      } else {
        // 1. Criar o cliente primeiro
        const clientData = {
          ...form,
          address: formAddresses.length > 0 ? formAddresses[0].street : '',
          neighborhood: formAddresses.length > 0 ? formAddresses[0].neighborhood : '',
        };

        const clientResponse = await api.post('/clients', clientData);
        const newClientId = clientResponse.data._id;

        // 2. Adicionar os endereços um por um
        if (formAddresses.length > 0) {
          for (const addr of formAddresses) {
            await api.post(`/clients/${newClientId}/addresses`, {
              street: addr.street,
              neighborhood: addr.neighborhood || '',
              city: addr.city || form.city || '',
              state: form.state || 'MG',
              reference: addr.reference || '',
              daysOfWeek: addr.daysOfWeek || [],
            });
          }
        }

        showNotification(`✅ Cliente cadastrado com ${formAddresses.length} endereço(s)!`);
      }

      setShowModal(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Erro:', error);
      if (error.response?.status === 409) {
        showNotification('❌ ' + error.response.data.error, 'error');
      } else {
        showNotification('❌ Erro ao salvar: ' + (error.response?.data?.error || error.message), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      city: client.city || '',
      state: client.state || 'MG',
      notes: client.notes || '',
    });
    setFormAddresses([]); // Não carregar endereços existentes na edição
    setShowModal(true);
  };

  const handleDelete = async (client) => {
    if (confirm(`Desativar cliente "${client.name}"?`)) {
      try {
        await api.delete(`/clients/${client._id}`);
        loadClients();
        setSelectedClient(null);
        showNotification('✅ Cliente desativado!');
      } catch (error) {
        showNotification('❌ Erro ao desativar', 'error');
      }
    }
  };

  const copyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    showNotification('📋 Telefone copiado!');
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', city: '', state: 'MG', notes: '' });
    setFormAddresses([]);
    setNewAddress({ street: '', neighborhood: '', city: '', reference: '', daysOfWeek: [] });
    setEditingClient(null);
    setShowAddressSection(true);
  };

  // ========== ADICIONAR ENDEREÇO A CLIENTE EXISTENTE ==========
  const openAddressModal = async (client) => {
    try {
      const response = await api.get(`/clients/${client._id}`);
      setSelectedClient(response.data);
      setNewAddress({ street: '', neighborhood: '', city: '', reference: '', daysOfWeek: [] });
      setShowAddressModal(true);
    } catch (error) {
      showNotification('❌ Erro ao carregar', 'error');
    }
  };

  const addAddressToExisting = async () => {
    if (!newAddress.street.trim()) {
      showNotification('❌ Endereço obrigatório', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/clients/${selectedClient._id}/addresses`, newAddress);
      const response = await api.get(`/clients/${selectedClient._id}`);
      setSelectedClient(response.data);
      setNewAddress({ street: '', neighborhood: '', city: '', reference: '', daysOfWeek: [] });
      loadClients();
      showNotification('✅ Endereço adicionado!');
    } catch (error) {
      showNotification('❌ ' + (error.response?.data?.error || 'Erro'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeAddressFromExisting = async (addressId) => {
    if (confirm('Remover endereço?')) {
      try {
        await api.delete(`/clients/${selectedClient._id}/addresses/${addressId}`);
        const response = await api.get(`/clients/${selectedClient._id}`);
        setSelectedClient(response.data);
        loadClients();
        showNotification('✅ Endereço removido!');
      } catch (error) {
        showNotification('❌ Erro ao remover', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right p-4 rounded-xl shadow-lg ${
          notification.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-strong flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-800 rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Salvando...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os seus clientes e endereços</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5 bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-primary-800" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clients.length}</p><p className="text-sm text-gray-500">Total</p></div>
          </div>
        </div>
        <div className="card-premium p-5 bg-gradient-to-br from-success/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center"><Check className="w-6 h-6 text-success" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.active).length}</p><p className="text-sm text-gray-500">Ativos</p></div>
          </div>
        </div>
        <div className="card-premium p-5 bg-gradient-to-br from-warning/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center"><Star className="w-6 h-6 text-warning" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clients.reduce((acc, c) => acc + (c.addresses?.length || 0), 0)}</p><p className="text-sm text-gray-500">Endereços</p></div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por nome, telefone..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input-premium pl-10" />
          </div>
          <button onClick={() => setFilterActive(!filterActive)}
            className={`btn-secondary flex items-center gap-2 ${filterActive ? 'border-primary-500 text-primary-800' : ''}`}>
            <Filter className="w-4 h-4" />{filterActive ? 'Ativos' : 'Todos'}
          </button>
        </div>
      </div>

      {/* Tabela de clientes */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-800 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando...</p>
            </div>
          ) : clients.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Contato</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Endereços</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Observações</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((client, index) => (
                  <tr key={client._id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedClient(selectedClient?._id === client._id ? null : client)}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">ID: #{client._id}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{client.phone}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {client.addresses?.slice(0, 3).map((addr, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full truncate max-w-[180px]" title={addr.street}>
                            <MapPin className="w-3 h-3 inline mr-1" />{addr.street}
                          </span>
                        ))}
                        {client.addresses?.length > 3 && <span className="text-xs text-primary-600">+{client.addresses.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">{client.notes || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${client.active ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                        {client.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); copyPhone(client.phone); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Copiar"><Copy className="w-4 h-4 text-gray-400" /></button>
                        <button onClick={(e) => { e.stopPropagation(); openAddressModal(client); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Endereços"><MapPin className="w-4 h-4 text-gray-400 hover:text-primary-600" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar"><Edit3 className="w-4 h-4 text-gray-400 hover:text-primary-600" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(client); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Desativar"><Trash2 className="w-4 h-4 text-gray-400 hover:text-danger" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel de detalhes */}
      {selectedClient && (
        <div className="card-premium animate-slide-up overflow-hidden">
          <div className="border-b border-gray-100">
            <div className="flex gap-0 px-6">
              {['info', 'addresses'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'border-primary-800 text-primary-800' : 'border-transparent text-gray-500'}`}>
                  {tab === 'info' ? 'Informações' : `Endereços (${selectedClient.addresses?.length || 0})`}
                </button>
              ))}
              <button onClick={() => setSelectedClient(null)} className="ml-auto p-2 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><label className="text-xs font-semibold text-gray-500 uppercase">Nome</label><p className="text-lg font-semibold text-gray-900 mt-1">{selectedClient.name}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Telefone</label><p className="text-sm text-gray-700 mt-1"><Phone className="w-4 h-4 inline text-gray-400 mr-1" />{selectedClient.phone}</p></div>
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Email</label><p className="text-sm text-gray-700 mt-1">{selectedClient.email || '-'}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { handleEdit(selectedClient); setSelectedClient(null); }} className="btn-secondary text-sm py-1.5 flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" />Editar</button>
                    <button onClick={() => handleDelete(selectedClient)} className="btn-danger text-sm py-1.5 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" />Desativar</button>
                  </div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Observações</label><p className="text-sm text-gray-700 mt-1 bg-gray-50 p-4 rounded-xl">{selectedClient.notes || '-'}</p></div>
              </div>
            )}
            {activeTab === 'addresses' && (
              <div className="space-y-3">
                <button onClick={() => openAddressModal(selectedClient)} className="btn-secondary text-sm py-1.5 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Adicionar Endereço</button>
                {selectedClient.addresses?.map((addr, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 rounded-xl">
                    <p className="font-medium text-gray-900"><MapPin className="w-4 h-4 inline text-gray-400 mr-1" />{addr.street}</p>
                    <p className="text-sm text-gray-500 mt-1">{addr.neighborhood} - {addr.city}</p>
                    {addr.daysOfWeek?.length > 0 && (
                      <div className="flex gap-1 mt-2">{addr.daysOfWeek.map((d, i) => <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{d}</span>)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL - CRIAR/EDITAR CLIENTE (COM ENDEREÇOS) ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Dados básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-premium">Nome *</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-premium" required /></div>
                <div><label className="label-premium">Telefone *</label><input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-premium" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-premium">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-premium" /></div>
                <div><label className="label-premium">Cidade</label><input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="input-premium" placeholder="Mariana-MG" /></div>
              </div>
              <div><label className="label-premium">Observações</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="textarea-premium" rows={2} /></div>

              {/* Seção de Endereços */}
              {!editingClient && (
                <div className="border-t pt-4">
                  <button type="button" onClick={() => setShowAddressSection(!showAddressSection)}
                    className="flex items-center justify-between w-full text-left mb-3">
                    <h3 className="font-semibold text-gray-900">📍 Endereços ({formAddresses.length})</h3>
                    {showAddressSection ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {showAddressSection && (
                    <div className="space-y-3">
                      {/* Lista de endereços adicionados */}
                      {formAddresses.map((addr, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{addr.street}</p>
                            <p className="text-xs text-gray-500">{addr.neighborhood} - {addr.city || form.city}</p>
                            {addr.daysOfWeek?.length > 0 && (
                              <div className="flex gap-1 mt-1">{addr.daysOfWeek.map(d => <span key={d} className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">{d}</span>)}</div>
                            )}
                          </div>
                          <button type="button" onClick={() => removeAddressFromForm(idx)} className="p-1.5 text-gray-400 hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}

                      {/* Formulário para novo endereço */}
                      <div className="p-4 border border-dashed border-gray-300 rounded-xl space-y-3">
                        <p className="text-sm font-medium text-gray-700">Novo Endereço</p>
                        <div><input type="text" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} className="input-premium text-sm" placeholder="Rua, número *" /></div>
                        <div className="grid grid-cols-3 gap-3">
                          <input type="text" value={newAddress.neighborhood} onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})} className="input-premium text-sm" placeholder="Bairro" />
                          <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} className="input-premium text-sm" placeholder="Cidade" />
                          <input type="text" value={newAddress.reference} onChange={(e) => setNewAddress({...newAddress, reference: e.target.value})} className="input-premium text-sm" placeholder="Referência" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Dias de atendimento</label>
                          <div className="flex flex-wrap gap-1">
                            {WEEKDAYS.map(day => (
                              <button key={day} type="button" onClick={() => toggleDay(day)}
                                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${newAddress.daysOfWeek.includes(day) ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-gray-600 border-gray-200'}`}>
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button type="button" onClick={addAddressToForm}
                          className="btn-secondary text-sm py-1.5 flex items-center gap-1.5 w-full justify-center">
                          <Plus className="w-3.5 h-3.5" />Adicionar à Lista
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : editingClient ? 'Atualizar' : `Cadastrar (${formAddresses.length} end.)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL - ENDEREÇOS (CLIENTE EXISTENTE) ========== */}
      {showAddressModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">📍 Endereços - {selectedClient.name}</h3>
              <button onClick={() => { setShowAddressModal(false); loadClients(); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedClient.addresses?.map(addr => (
                <div key={addr._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{addr.street}</p>
                    <p className="text-xs text-gray-400">{addr.neighborhood} - {addr.city}</p>
                    {addr.daysOfWeek?.length > 0 && <div className="flex gap-1 mt-1">{addr.daysOfWeek.map(d => <span key={d} className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">{d}</span>)}</div>}
                  </div>
                  <button onClick={() => removeAddressFromExisting(addr._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-500 uppercase mb-3">+ Novo endereço</p>
                <div className="space-y-3">
                  <input type="text" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} className="input-premium" placeholder="Rua, número *" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={newAddress.neighborhood} onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})} className="input-premium" placeholder="Bairro" />
                    <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} className="input-premium" placeholder="Cidade" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Dias da semana</label>
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAYS.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`px-2.5 py-1 text-xs rounded-lg border ${newAddress.daysOfWeek.includes(day) ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-gray-600 border-gray-200'}`}>{day}</button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={addAddressToExisting} className="w-full py-2.5 bg-light text-white rounded-xl hover:bg-light-hover font-medium">+ Adicionar</button>
                </div>
              </div>
              <button type="button" onClick={() => { setShowAddressModal(false); loadClients(); }} className="w-full py-2.5 bg-primary-800 text-white rounded-xl hover:bg-primary-900 font-medium">Concluído</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}