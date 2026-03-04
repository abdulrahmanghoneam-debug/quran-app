import { useState, useEffect } from "react";

export function useFavorites() {
    const [favorites, setFavorites] = useState<number[]>(() => {
        const saved = localStorage.getItem("favorite_surahs");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("favorite_surahs", JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (id: number) => {
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
        );
    };

    const isFavorite = (id: number) => favorites.includes(id);

    return { favorites, toggleFavorite, isFavorite };
}
