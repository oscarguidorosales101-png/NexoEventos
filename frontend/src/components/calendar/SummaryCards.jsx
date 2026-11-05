import React from 'react';

export const SummaryCards = ({ summary = {}, selectedCategory, onSelectCategory }) => {
  const cards = [
    {
      key: 'all',
      title: 'Total Agendas',
      count: summary.total || 0,
      color: 'var(--gold-primary)',
      sub: 'Todas las actividades',
      categoryId: null
    },
    {
      key: 'event',
      title: 'Eventos',
      count: summary.event || 0,
      color: '#D4AF37',
      sub: 'Ejecución social y corporativa',
      categoryId: summary.categoryMap?.['Event'] || null
    },
    {
      key: 'meeting',
      title: 'Reuniones',
      count: summary.meeting || 0,
      color: '#3B82F6',
      sub: 'Coordinación y clientes',
      categoryId: summary.categoryMap?.['Meeting'] || null
    },
    {
      key: 'setup',
      title: 'Montaje / Ensayo',
      count: summary.setup || 0,
      color: '#F59E0B',
      sub: 'Logística previa',
      categoryId: summary.categoryMap?.['Setup and Rehearsal'] || null
    },
    {
      key: 'deadline',
      title: 'Entregas / Tareas',
      count: summary.deadline || 0,
      color: '#EC4899',
      sub: 'Hitos operativos clave',
      categoryId: summary.categoryMap?.['Task Deadlines'] || null
    }
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card) => {
        const isSelected =
          card.key === 'all'
            ? !selectedCategory
            : selectedCategory === card.categoryId;

        return (
          <div
            key={card.key}
            className={`summary-card ${isSelected ? 'active-filter' : ''}`}
            style={{ '--category-color': card.color }}
            onClick={() => onSelectCategory(card.categoryId)}
            role="button"
            tabIndex={0}
          >
            <div className="summary-card-header">
              <span className="summary-card-title">{card.title}</span>
              <span className="summary-card-badge" />
            </div>
            <div className="summary-card-count">{card.count}</div>
            <div className="summary-card-sub">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
};

