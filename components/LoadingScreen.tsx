import { Spinner } from './Spinner';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = '読み込み中...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
