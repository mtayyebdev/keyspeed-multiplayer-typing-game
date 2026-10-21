/**
 * Export array of records to a CSV file and trigger browser download
 */
export function exportToCsv(filename, rows, headers) {
  if (!rows || !rows.length) {
    return;
  }

  const columnKeys = headers ? Object.keys(headers) : Object.keys(rows[0]);
  const headerLabels = headers ? Object.values(headers) : columnKeys;

  const csvRows = [
    headerLabels.map((label) => `"${String(label).replace(/"/g, '""')}"`).join(','),
  ];

  for (const row of rows) {
    const values = columnKeys.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return '""';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

