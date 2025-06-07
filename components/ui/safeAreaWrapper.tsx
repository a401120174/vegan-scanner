export default function SafeAreaWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      boxSizing: 'border-box',
      height: '100vh',
    }}>
      {children}
    </div>
  );
}