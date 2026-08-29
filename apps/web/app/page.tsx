import { AppShell } from '@/components/layout/AppShell';
import { UploadScreen } from '@/components/upload/UploadScreen';

export default function ExamsUploadPage() {
  return (
    <AppShell section="Exams" userName="Madhur Rastogi" activeHref="/">
      <UploadScreen />
    </AppShell>
  );
}
