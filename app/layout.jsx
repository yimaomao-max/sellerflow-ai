import "./globals.css";

export const metadata = {
  title: "SellerFlow AI — 电商商品管理助手",
  description: "帮助跨境卖家批量处理商品资料：导入、AI 标题、翻译、批量编辑、CSV 导出与校验",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
