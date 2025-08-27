export function openPayrollPopup(opts: {
  year: number;
  month: number;
  orgId?: string | null;
  employeeId?: string | null;
  name?: string;
}) {
  const { year, month, orgId, employeeId, name } = opts;

  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month));
  if (orgId) params.set("orgId", orgId);
  if (employeeId) params.set("employee", employeeId);

  const url = `${window.location.origin}/payroll/editor?${params.toString()}`;

  // Tamaño/posición centrada
  const width = Math.min(1100, Math.floor(window.screen.availWidth * 0.9));
  const height = Math.min(800, Math.floor(window.screen.availHeight * 0.9));
  const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));

  const features = [
    "popup=yes",
    "noopener",
    "noreferrer",
    "resizable=yes",
    "scrollbars=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
  ].join(",");

  const win = window.open(
    url,
    name ?? `payroll_editor_${year}_${String(month).padStart(2, "0")}`,
    features
  );

  if (!win) {
    alert("Debes permitir ventanas emergentes para este sitio para abrir el editor.");
    return null;
  }
  win.focus();
  return win;
}
