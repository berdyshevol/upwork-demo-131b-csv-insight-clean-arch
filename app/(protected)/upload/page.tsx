import UploadClient from "@/components/UploadClient";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Upload a CSV</h1>
        <p className="mt-1 text-sm text-slate-500">
          We parse it on the server — detecting headers, counting rows and sniffing
          column types — then store it so you can explore it on the dashboard.
        </p>
      </div>
      <UploadClient />
    </div>
  );
}
