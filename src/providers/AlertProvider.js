"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Alert } from "@heroui/alert";
import { AnimatePresence, motion } from "framer-motion";

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const alertIdCounter = useRef(0);

    const addAlert = useCallback((message, type = 'default', duration = 3000) => {
        const id = alertIdCounter.current++;
        // Map common types to HeroUI/NextUI specific colors/props if needed
        // HeroUI Alert props: color="primary" | "secondary" | "success" | "warning" | "danger" | "default"
        const colorMap = {
            success: "success",
            error: "danger",
            warning: "warning",
            info: "primary",
            default: "default"
        };

        const color = colorMap[type] || "default";

        setAlerts((prev) => [...prev, { id, message, color }]);

        if (duration > 0) {
            setTimeout(() => {
                removeAlert(id);
            }, duration);
        }
    }, []);

    const removeAlert = useCallback((id) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, []);

    return (
        <AlertContext.Provider value={{ addAlert }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="pointer-events-auto shadow-lg"
                        >
                            <Alert
                                color={alert.color}
                                title={alert.message}
                                isClosable
                                onClose={() => removeAlert(alert.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </AlertContext.Provider>
    );
};
