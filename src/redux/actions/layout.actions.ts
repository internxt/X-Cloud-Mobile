import { Dispatch } from 'redux';
import { layoutActionTypes, fileActionTypes } from '../constants';

export const layoutActions = {
  openSearch,
  closeSearch,
  openSettings,
  closeSettings,
  openItemModal,
  closeItemModal,
  openRunOutStorageModal,
  openFreeForYouModal,
  closeFreeForYouModal,
  closeRunOutStorageModal,
  openSortModal,
  closeSortModal,
  openMoveFilesModal,
  closeMoveFilesModal
};

function openSearch() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.OPEN_SEARCH_FORM });
  };
}

function closeSearch() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_SEARCH_FORM });
  };
}

function openSettings() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.OPEN_SETTINGS_MODAL });
  };
}

function closeSettings() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_SETTINGS_MODAL });
  };
}

function openItemModal(item: any) {
  return (dispatch: Dispatch) => {
    if (item) {
      dispatch({ type: fileActionTypes.SELECT_FILE, payload: item });
    }
    dispatch({ type: layoutActionTypes.OPEN_ITEM_MODAL, payload: item });
  };
}

function closeItemModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_ITEM_MODAL });
  };
}

function openRunOutStorageModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.OPEN_RUNOUTSTORAGE_MODAL });
  };
}

function openFreeForYouModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.OPEN_FREEFORYOU_MODAL });
  };
}

function closeFreeForYouModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_FREEFORYOU_MODAL });
  };
}

function closeRunOutStorageModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_RUNOUTSTORAGE_MODAL });
  };
}

function openSortModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.OPEN_SORT_MODAL });
  };
}

function closeSortModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_SORT_MODAL });
  };
}

function openMoveFilesModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.OPEN_MOVEFILES_MODAL });
  };
}

function closeMoveFilesModal() {
  return (dispatch: Dispatch) => {
    dispatch({ type: layoutActionTypes.CLOSE_MOVEFILES_MODAL });
  };
}
