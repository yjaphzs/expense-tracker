import AppHeader from "@/components/dom/app-header";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import KofiButton from "@/components/dom/KofiButton";

declare const __APP_VERSION__: string;

function App() {
    const appName = import.meta.env.VITE_APP_NAME || "My App";
    const appVersion = __APP_VERSION__;

    return (
        <div className="flex flex-col items-center justify-center min-h-svh p-4">
            <main className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-3xl">
                    <div className="flex flex-row items-center justify-between w-full">
                        <AppHeader appName={appName} appVersion={appVersion} />
                        <ThemeSwitcher />
                    </div>
                </div>
            </main>

            <footer className="w-full flex justify-center py-6 bg-transparent">
                <KofiButton
                    username="yjaphzs"
                    label="Buy Me a Ko-fi"
                    preset="no_background"
                />
            </footer>
        </div>
    );
}

export default App;
