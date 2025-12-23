'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ConfirmModal from '@/components/ConfirmModal';

interface Room {
  _id: string;
  category: 'vip' | 'regular';
  bedType: number;
  roomNumber: string;
  price: number;
  isAvailable: boolean;
  customerName?: string;
  checkInTime?: string;
}

export default function RoomsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [customerName, setCustomerName] = useState('');
  
  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    roomNumber: '',
    category: 'regular' as 'vip' | 'regular',
    bedType: 1,
    price: 0,
    isAvailable: true,
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const result = await response.json();
      if (result.success) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (id: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkCheckIn = async () => {
    if (selectedRoomIds.length === 0) return;
    setShowCheckInModal(true);
  };

  const confirmBulkCheckIn = async () => {
    try {
      const response = await fetch('/api/rooms/bulk-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomIds: selectedRoomIds, customerName }),
      });
      const result = await response.json();
      if (result.success) {
        fetchRooms();
        setSelectedRoomIds([]);
        setShowCheckInModal(false);
        setCustomerName('');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error in bulk check-in:', error);
    }
  };

  const handleBulkCheckOut = async () => {
    if (selectedRoomIds.length === 0) return;
    
    setConfirmConfig({
      title: t('common.confirm'),
      message: t('common.confirmCheckOut'),
      onConfirm: async () => {
        try {
          const response = await fetch('/api/rooms/bulk-check-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomIds: selectedRoomIds }),
          });
          const result = await response.json();
          if (result.success) {
            fetchRooms();
            setSelectedRoomIds([]);
            const total = result.data.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
            const totalMsg = t('common.totalCollected', { amount: new Intl.NumberFormat('vi-VN').format(total) });
            alert(totalMsg);
          } else {
            alert(result.error);
          }
        } catch (error) {
          console.error('Error in bulk check-out:', error);
        } finally {
          setShowConfirm(false);
        }
      },
      type: 'warning'
    });
    setShowConfirm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom._id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        fetchRooms();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: t('common.confirm'),
      message: t('common.confirmDelete'),
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
          const result = await response.json();
          if (result.success) {
            fetchRooms();
          }
        } catch (error) {
          console.error('Error deleting room:', error);
        } finally {
          setShowConfirm(false);
        }
      },
      type: 'danger'
    });
    setShowConfirm(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      category: room.category,
      bedType: room.bedType,
      price: room.price,
      isAvailable: room.isAvailable,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      category: 'regular',
      bedType: 1,
      price: 0,
      isAvailable: true,
    });
    setEditingRoom(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('room.title')}</h1>
          <div className="space-x-2">
            {selectedRoomIds.length > 0 && (
              <>
                <button
                  onClick={handleBulkCheckIn}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('room.bulkCheckIn')}
                </button>
                <button
                  onClick={handleBulkCheckOut}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {t('room.bulkCheckOut')}
                </button>
              </>
            )}
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('room.addRoom')}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedRoomIds(rooms.map(r => r._id));
                      else setSelectedRoomIds([]);
                    }}
                    checked={selectedRoomIds.length === rooms.length && rooms.length > 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('room.roomNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('room.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('room.bedType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('room.availability')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('room.customerName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room._id} className={selectedRoomIds.includes(room._id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedRoomIds.includes(room._id)}
                        onChange={() => handleSelectRoom(room._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {room.roomNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t(`room.${room.category}`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.bedType} {t('room.beds')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          room.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {room.isAvailable ? t('room.available') : t('room.unavailable')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.customerName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(room)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(room._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Room Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-sm shadow-lg rounded-xl bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingRoom ? t('room.editRoom') : t('room.addRoom')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('room.roomNumber')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('room.category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'vip' | 'regular' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="regular">{t('room.regular')}</option>
                    <option value="vip">{t('room.vip')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('room.bedType')}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.bedType}
                    onChange={(e) => setFormData({ ...formData, bedType: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('room.price')}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">{t('room.available')}</label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Check-in Modal */}
        {showCheckInModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-sm shadow-lg rounded-xl bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('room.checkIn')}</h3>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">{t('common.selectedRooms', { count: selectedRoomIds.length })}</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('room.customerName')}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('common.enterGuestName')}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmBulkCheckIn}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('room.checkIn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setShowConfirm(false)}
          type={confirmConfig.type}
        />
      </div>
    </div>
  );
}
