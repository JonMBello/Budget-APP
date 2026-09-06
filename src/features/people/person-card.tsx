import Link from "next/link";
import { type Person } from "./contracts";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function PersonCard({
  person,
  linked = true,
}: {
  person: Person;
  linked?: boolean;
}) {
  const content = (
    <>
      <div className="person-avatar" aria-hidden="true">
        {getInitials(person.name)}
      </div>
      <div className="person-info">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3 className="person-name">{person.name}</h3>
          {!person.isActive && (
            <span
              className="card-type-tag"
              style={{ fontSize: "0.625rem", padding: "2px 8px" }}
              role="status"
            >
              Archivada
            </span>
          )}
        </div>
        {person.contact && <p className="person-contact">{person.contact}</p>}
        {person.notes && <p className="person-notes">{person.notes}</p>}
      </div>
    </>
  );

  if (linked) {
    return (
      <Link
        href={`/people/${person.id}`}
        className={`person-item ${!person.isActive ? "inactive" : ""}`}
        aria-label={`${person.name}${person.contact ? `, ${person.contact}` : ""}${!person.isActive ? " (archivada)" : ""}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`person-item ${!person.isActive ? "inactive" : ""}`}>
      {content}
    </div>
  );
}
