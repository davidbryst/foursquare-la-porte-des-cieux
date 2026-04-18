import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type MemberSavePayload = {
  id: number;
  nom: string;
  prenom: string;
  numero: string;
  categorie: string;
};

type PresenceSavePayload = {
  id: number;
  presenceStatus: 'Présent' | 'Absent';
  culte: string;
  pkabsence?: string | null;
};

type VisitorSavePayload = {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  culteId: number;
  categorie: string;
  age: number | null;
  provenance: string;
};

type ModalContextType = {
  isMemberModalOpen: boolean;
  isPresenceModalOpen: boolean;
  isVisitorModalOpen: boolean;
  selectedMember: any | null;
  selectedPresence: any | null;
  selectedVisitor: any | null;
  openMemberModal: (member: any) => void;
  closeMemberModal: () => void;
  openPresenceModal: (presence: any) => void;
  closePresenceModal: () => void;
  openVisitorModal: (visitor: any) => void;
  closeVisitorModal: () => void;
  onMemberSave?: (payload: MemberSavePayload) => Promise<void>;
  setMemberSaveHandler: (handler: (payload: MemberSavePayload) => Promise<void>) => void;
  onPresenceSave?: (payload: PresenceSavePayload) => Promise<void>;
  setPresenceSaveHandler: (handler: (payload: PresenceSavePayload) => Promise<void>) => void;
  onVisitorSave?: (payload: VisitorSavePayload) => Promise<void>;
  setVisitorSaveHandler: (handler: (payload: VisitorSavePayload) => Promise<void>) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedPresence, setSelectedPresence] = useState<any | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const [onMemberSave, setOnMemberSave] = useState<ModalContextType['onMemberSave']>();
  const [onPresenceSave, setOnPresenceSave] = useState<ModalContextType['onPresenceSave']>();
  const [onVisitorSave, setOnVisitorSave] = useState<ModalContextType['onVisitorSave']>();

  const openMemberModal = (member: any) => { setSelectedMember(member); setIsMemberModalOpen(true); };
  const closeMemberModal = () => { setIsMemberModalOpen(false); setSelectedMember(null); };

  const openPresenceModal = (presence: any) => { setSelectedPresence(presence); setIsPresenceModalOpen(true); };
  const closePresenceModal = () => { setIsPresenceModalOpen(false); setSelectedPresence(null); };

  const openVisitorModal = (visitor: any) => { setSelectedVisitor(visitor); setIsVisitorModalOpen(true); };
  const closeVisitorModal = () => { setIsVisitorModalOpen(false); setSelectedVisitor(null); };

  const setMemberSaveHandler: ModalContextType['setMemberSaveHandler'] = (h) => setOnMemberSave(() => h);
  const setPresenceSaveHandler: ModalContextType['setPresenceSaveHandler'] = (h) => setOnPresenceSave(() => h);
  const setVisitorSaveHandler: ModalContextType['setVisitorSaveHandler'] = (h) => setOnVisitorSave(() => h);

  return (
    <ModalContext.Provider
      value={{
        isMemberModalOpen, isPresenceModalOpen, isVisitorModalOpen,
        selectedMember, selectedPresence, selectedVisitor,
        openMemberModal, closeMemberModal,
        openPresenceModal, closePresenceModal,
        openVisitorModal, closeVisitorModal,
        onMemberSave, setMemberSaveHandler,
        onPresenceSave, setPresenceSaveHandler,
        onVisitorSave, setVisitorSaveHandler,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
