import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400">
          © 2024 雨漏りドクター. All rights reserved.
        </p>
        <div className="mt-4 space-x-4">
          <Link href="/privacy" className="text-gray-400 hover:text-white">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="text-gray-400 hover:text-white">
            特定商取引法に基づく表記
          </Link>
        </div>
      </div>
    </footer>
  );
}
