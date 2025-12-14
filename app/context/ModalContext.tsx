import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type MemberSavePayload = {
  id: number;
  nom: string;
  prenom: string;
  numero: string;
};

type PresenceSavePayload = {
  id: number;
  presenceStatus: 'Présent' | 'Absent';
  culte: string;
  pkabsence?: string | null;
};

type ModalContextType = {
  isMemberModalOpen: boolean;
  isPresenceModalOpen: boolean;
  selectedMember: any | null;
  selectedPresence: any | null;
  openMemberModal: (member: any) => void;
  closeMemberModal: () => void;
  openPresenceModal: (presence: any) => void;
  closePresenceModal: () => void;
  onMemberSave?: (payload: MemberSavePayload) => void;
  setMemberSaveHandler: (handler: (payload: MemberSavePayload) => void) => void;
  onPresenceSave?: (payload: PresenceSavePayload) => void;
  setPresenceSaveHandler: (handler: (payload: PresenceSavePayload) => void) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedPresence, setSelectedPresence] = useState<any | null>(null);
  const [onMemberSave, setOnMemberSave] = useState<ModalContextType['onMemberSave']>();
  const [onPresenceSave, setOnPresenceSave] = useState<ModalContextType['onPresenceSave']>();

  const openMemberModal = (member: any) => {
    setSelectedMember(member);
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setSelectedMember(null);
  };

  const openPresenceModal = (presence: any) => {
    setSelectedPresence(presence);
    setIsPresenceModalOpen(true);
  };

  const closePresenceModal = () => {
    setIsPresenceModalOpen(false);
    setSelectedPresence(null);
  };

  const setMemberSaveHandler: ModalContextType['setMemberSaveHandler'] = (handler) => {
    setOnMemberSave(() => handler);
  };

  const setPresenceSaveHandler: ModalContextType['setPresenceSaveHandler'] = (handler) => {
    setOnPresenceSave(() => handler);
  };

  return (
    <ModalContext.Provider
      value={{
        isMemberModalOpen,
        isPresenceModalOpen,
        selectedMember,
        selectedPresence,
        openMemberModal,
        closeMemberModal,
        openPresenceModal,
        closePresenceModal,
        onMemberSave,
        setMemberSaveHandler,
        onPresenceSave,
        setPresenceSaveHandler,
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
