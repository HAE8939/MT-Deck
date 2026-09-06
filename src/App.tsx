import { useEffect } from "react";
import { initApp, useApp } from "./store/store";
import { useAppCloseGuard, useFileWatcher, useShortcuts, useThemeEffect } from "./hooks/useAppHooks";
import { FirstLaunch } from "./components/layout/FirstLaunch";
import { AppShell } from "./components/layout/AppShell";
import { TitleBar } from "./components/layout/TitleBar";

export default function App() {
  const app = useApp();

  useEffect(() => {
    void initApp();
  }, []);

  useThemeEffect(app.theme);
  useFileWatcher();
  useShortcuts();
  useAppCloseGuard();

  return (
    <div className="window">
      <TitleBar />
      <div className="window-body">
        {!app.ready ? (
          <div className="boot" aria-hidden="true" />
        ) : !app.libraryRoot ? (
          <FirstLaunch />
        ) : (
          <AppShell />
        )}
      </div>
    </div>
  );
}
