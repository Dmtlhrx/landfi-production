import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { Button, Badge } from '@hedera-africa/ui';
import { useUIStore } from '@/store/uiStore';
import { formatDateTime } from '@/utils/formatters';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { notifications, markNotificationRead, clearNotifications } = useUIStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
    });
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative transition-all duration-300 hover:bg-dark-700/50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - même style que le menu utilisateur */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel - même style que le menu utilisateur */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 bg-dark-900/95 backdrop-blur-xl border border-dark-600/50 rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-dark-600/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-lg">Notifications</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-dark-700/50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Action buttons */}
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors duration-300 flex items-center gap-1"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Tout marquer comme lu
                      </button>
                    )}
                    <button
                      onClick={clearNotifications}
                      className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors duration-300 ml-auto"
                    >
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Aucune notification</p>
                    <p className="text-gray-500 text-sm mt-1">Vous êtes à jour !</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-3 mb-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                          notification.read
                            ? 'bg-dark-800/30 hover:bg-dark-700/40'
                            : 'bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30'
                        }`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                              )}
                              <h4 className="text-white font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                            </div>
                            
                            {notification.message && (
                              <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            
                            <span className="text-gray-500 text-xs">
                              {formatDateTime(notification.timestamp)}
                            </span>
                          </div>

                          {/* Action buttons - visible au hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="p-1 text-primary-400 hover:text-primary-300 hover:bg-primary-500/20 rounded transition-all duration-300"
                                title="Marquer comme lu"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer - optionnel */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-dark-600/30">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to notifications page if you have one
                      // navigate('/notifications');
                    }}
                    className="w-full text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors duration-300 py-2"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;