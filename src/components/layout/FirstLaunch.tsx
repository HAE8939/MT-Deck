import { chooseLibraryFolder, createNewLibrary } from "../../store/store";
import { Logo } from "../common/Logo";

export function FirstLaunch() {
  return (
    <div className="first-launch">
      <div className="first-launch-card">
        <Logo size={72} className="first-launch-logo" title="MT-Deck" />
        <h1 className="wordmark">MT-Deck</h1>
        <p className="first-launch-tagline">你的私人 AI 提示词库。</p>
        <p className="first-launch-sub">所有提示词都保存在你自己的电脑上。</p>
        <div className="first-launch-actions">
          <button className="btn btn-primary" onClick={() => void chooseLibraryFolder()}>
            选择提示词文件夹
          </button>
          <span className="first-launch-or">或</span>
          <button className="btn btn-ghost" onClick={() => void createNewLibrary()}>
            新建提示词库
          </button>
        </div>
      </div>
    </div>
  );
}
