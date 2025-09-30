 tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#137fec",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
                "foreground-light": "#0d141b",
                "foreground-dark": "#f0f2f4",
                "subtle-light": "#e7edf3",
                "subtle-dark": "#202a35",
                "muted-light": "#64748b",
                "muted-dark": "#94a3b8",
                "success": "#22c55e",
                "warning": "#f59e0b",
                "danger": "#ef4444"
            },
            fontFamily: {
                "sans": ["Public Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "full": "9999px"
            },
        },
    },
}