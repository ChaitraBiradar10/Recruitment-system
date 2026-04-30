import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';

const DEPT_ABBR = {
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication': 'ECE',
  'Mechanical Engineering': 'ME',
  'Civil Engineering': 'CE',
  'Electrical Engineering': 'EE',
  'Information Technology': 'IT',
  'Artificial Intelligence & Data Science': 'AI&DS',
  'Electronics & Electrical Engineering': 'EEE',
  'Chemical Engineering': 'CHE',
  'Aerospace Engineering': 'AERO',
  'Automobile Engineering': 'AUTO',
  'Biotechnology Engineering': 'BT',
  'Master of Computer Applications': 'MCA',
};

const csvValue = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

function SelectedStudentsFilters({
  search,
  onSearchChange,
  deptFilter,
  onDeptChange,
  companyFilter,
  onCompanyChange,
  batchFilter,
  onBatchChange,
  departments,
  companies,
  batches,
}) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
        Search And Filters
      </div>
      <div className="search-bar" style={{ marginBottom: 0 }}>
        <input
          className="search-input"
          placeholder="Search by name, email, roll number, company, job title, or batch..."
          value={search}
          onChange={event => onSearchChange(event.target.value)}
        />
        <select className="filter-select" value={deptFilter} onChange={event => onDeptChange(event.target.value)}>
          {departments.map(department => (
            <option key={department} value={department}>
              {department === 'ALL' ? 'All Departments' : department}
            </option>
          ))}
        </select>
        <select className="filter-select" value={companyFilter} onChange={event => onCompanyChange(event.target.value)}>
          {companies.map(company => (
            <option key={company} value={company}>
              {company === 'ALL' ? 'All Companies' : company}
            </option>
          ))}
        </select>
        <select className="filter-select" value={batchFilter} onChange={event => onBatchChange(event.target.value)}>
          {batches.map(batch => (
            <option key={batch} value={batch}>
              {batch === 'ALL' ? 'All Batches' : `Batch ${batch}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AdminSelectedStudents() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');

  useEffect(() => {
    adminService.getSelectedStudents()
      .then(response => {
        const selectedStudents = [...response.data]
          .sort((a, b) => `${b.selectedCompanies}`.localeCompare(`${a.selectedCompanies}`));

        setStudents(selectedStudents);
        setFiltered(selectedStudents);
      })
      .catch(error => {
        console.error('Error loading selected students:', error);
        toast.error('Failed to load selected students.');
      })
      .finally(() => setLoading(false));
  }, []);

  const getDeptAbbr = department => {
    if (!department) return '--';
    return DEPT_ABBR[department] || department;
  };

  const departments = useMemo(
    () => ['ALL', ...new Set(students.map(student => getDeptAbbr(student.department)).filter(Boolean))],
    [students],
  );

  const companies = useMemo(
    () => [
      'ALL',
      ...new Set(
        students.flatMap(student =>
          `${student.selectedCompanies || ''}`
            .split(',')
            .map(company => company.trim())
            .filter(Boolean),
        ),
      ),
    ],
    [students],
  );

  const batches = useMemo(
    () => ['ALL', ...new Set(students.map(student => student.batchYear).filter(Boolean))],
    [students],
  );

  useEffect(() => {
    let result = [...students];

    if (deptFilter !== 'ALL') {
      result = result.filter(student => getDeptAbbr(student.department) === deptFilter);
    }

    if (companyFilter !== 'ALL') {
      result = result.filter(student =>
        `${student.selectedCompanies || ''}`
          .split(',')
          .map(company => company.trim())
          .includes(companyFilter),
      );
    }

    if (batchFilter !== 'ALL') {
      result = result.filter(student => student.batchYear === batchFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(student =>
        [
          student.firstName,
          student.lastName,
          student.email,
          student.rollNumber,
          student.batchYear,
          student.selectedCompanies,
          student.selectedJobTitles,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query),
      );
    }

    setFiltered(result);
  }, [batchFilter, companyFilter, deptFilter, search, students]);

  const downloadFilteredList = () => {
    if (filtered.length === 0) {
      toast.error('No students available for download.');
      return;
    }

    const rows = [
      ['Student Name', 'Email', 'Roll Number', 'Department', 'Phone', 'Selected Companies', 'Selected Job Titles'],
      ...filtered.map(student => [
        `${student.firstName} ${student.lastName}`.trim(),
        student.email,
        student.rollNumber,
        getDeptAbbr(student.department),
        student.phone || '',
        student.selectedCompanies || '',
        student.selectedJobTitles || '',
      ]),
    ];

    const csv = rows.map(row => row.map(csvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const searchSuffix = search.trim()
      ? search.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : 'all';

    anchor.href = url;
    anchor.download = `selected-students-${searchSuffix}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Selected Students</div>
          <div className="topbar-sub">Students selected for company placements</div>
        </div>
        <div className="selected-students-meta">
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            {filtered.length} of {students.length}
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={downloadFilteredList}>
            Download
          </button>
        </div>
      </div>

      <div className="page-content">
        <SelectedStudentsFilters
          search={search}
          onSearchChange={setSearch}
          deptFilter={deptFilter}
          onDeptChange={setDeptFilter}
          companyFilter={companyFilter}
          onCompanyChange={setCompanyFilter}
          batchFilter={batchFilter}
          onBatchChange={setBatchFilter}
          departments={departments}
          companies={companies}
          batches={batches}
        />

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Dept</th>
                  <th>Batch</th>
                  <th>Company</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                      No selected students found for the current filter.
                    </td>
                  </tr>
                )}

                {filtered.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">
                          {student.firstName?.[0]}
                          {student.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {student.firstName} {student.lastName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{student.rollNumber}</td>
                    <td style={{ fontSize: 12 }}>{getDeptAbbr(student.department)}</td>
                    <td style={{ fontSize: 12 }}>{student.batchYear || '--'}</td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>
                        {student.selectedCompanies || '--'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        {student.selectedJobTitles || 'Selected role details unavailable'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{student.phone || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
