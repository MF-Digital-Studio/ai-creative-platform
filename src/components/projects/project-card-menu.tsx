"use client";

import {useState} from "react";
import {deleteProject} from "@/app/[locale]/dashboard/actions";
import {DeleteProjectModal} from "@/components/projects/delete-project-modal";
import {Button} from "@/components/ui/button";
import type {AppLocale} from "@/i18n/routing";

type ProjectCardMenuProps = {
  projectId: string;
  locale: AppLocale;
  menuLabel: string;
  deleteMessages: {title: string; description: string; menuItem: string; cancel: string; confirm: string; deleting: string; error: string};
  redirectOnSuccess?: boolean;
};

export function ProjectCardMenu({projectId, locale, menuLabel, deleteMessages, redirectOnSuccess = false}: ProjectCardMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const action = deleteProject.bind(null, locale, projectId);

  return <div className="project-card-actions" onClick={(event) => event.stopPropagation()}>
    <Button type="button" variant="ghost" size="sm" className="project-card-menu-trigger" aria-label={menuLabel} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
      <span aria-hidden="true">···</span>
    </Button>
    {menuOpen ? <div className="project-card-menu-content" role="menu" onKeyDown={(event) => { if (event.key === "Escape") setMenuOpen(false); }}>
      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setModalOpen(true); }}>{deleteMessages.menuItem}</button>
    </div> : null}
    <DeleteProjectModal action={action} open={modalOpen} onClose={() => setModalOpen(false)} redirectOnSuccess={redirectOnSuccess} messages={deleteMessages} />
  </div>;
}
