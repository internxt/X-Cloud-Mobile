import { Dispatch } from 'redux';
import { fileActionTypes } from '../constants';
import { fileService } from '../services';
import { userActions } from './user.actions';

export const fileActions = {
  downloadFile,
  downloadFileStart,
  downloadFileEnd,
  downloadSelectedFileStart,
  downloadSelectedFileStop,
  uploadFileStart,
  uploadFileFinished,
  uploadFileFailed,
  getFolderContent,
  selectFile,
  deselectFile,
  deselectAll,
  deleteItems,
  setSortFunction,
  setSearchString,
  createFolder,
  updateFolderMetadata,
  moveFile
};

function downloadFileStart(fileId: string) {
  return { type: fileActionTypes.DOWNLOAD_FILE_START, payload: fileId };
}
function downloadFileEnd(fileId: string) {
  return { type: fileActionTypes.DOWNLOAD_FILE_END, payload: fileId };
}

// Will only download the current selected file defined in props
function downloadSelectedFileStart() {
  return { type: fileActionTypes.DOWNLOAD_SELECTED_FILE_START };
}

function downloadSelectedFileStop() {
  return { type: fileActionTypes.DOWNLOAD_SELECTED_FILE_STOP };
}

// TODO: Will download the file specified in the parameters.
function downloadFile(user: string, file: string) {
  return (dispatch: Dispatch) => {
    dispatch(request());

    fileService
      .downloadFile(user, file)
      .then(result => {
        dispatch(success(result));
      })
      .catch(error => {
        dispatch(failure(error));
      });
  };

  function request() {
    return { type: fileActionTypes.ADD_FILE_REQUEST };
  }
  function success(payload: any) {
    return { type: fileActionTypes.ADD_FILE_SUCCESS };
  }
  function failure(error: string) {
    return { type: fileActionTypes.ADD_FILE_FAILURE, error };
  }
}

function uploadFileStart(fileName: string) {
  return { type: fileActionTypes.ADD_FILE_REQUEST, payload: fileName };
}

function uploadFileFinished() {
  return { type: fileActionTypes.ADD_FILE_SUCCESS };
}

function uploadFileFailed() {
  return { type: fileActionTypes.ADD_FILE_FAILURE };
}

function getFolderContent(folderId: string) {
  const id = parseInt(folderId);
  if (isNaN(id)) {
    return (dispatch: Dispatch) => {
      dispatch(failure(`Folder ID: "${folderId}" is not a number.`));
    };
  }

  return (dispatch: Dispatch) => {
    dispatch(request());
    fileService
      .getFolderContent(id)
      .then((data: any) => {
        data.currentFolder = id;
        dispatch(success(data));
      })
      .catch(error => {
        dispatch(failure(error));

        if (error.status === 401) {
          dispatch(userActions.signout());
        }
      });
  };

  function request() {
    return { type: fileActionTypes.GET_FILES_REQUEST };
  }
  function success(payload: any) {
    return { type: fileActionTypes.GET_FILES_SUCCESS, payload };
  }
  function failure(error: any) {
    return { type: fileActionTypes.GET_FILES_FAILURE, error };
  }
}

function deleteItems(items, folderToReload) {
  return async (dispatch: Dispatch) => {
    dispatch(request());
    fileService
      .deleteItems(items)
      .then(() => {
        dispatch(requestSuccess());
        setTimeout(() => {
          dispatch(getFolderContent(folderToReload));
        }, 1000);
      })
      .catch(err => {
        dispatch(requestFailure());
        setTimeout(() => {
          dispatch(getFolderContent(folderToReload));
        }, 1000);
      });
  };

  function request() {
    return { type: fileActionTypes.DELETE_FILE_REQUEST, payload: items };
  }

  function requestFailure() {
    return { type: fileActionTypes.DELETE_FILE_FAILURE };
  }

  function requestSuccess() {
    return { type: fileActionTypes.DELETE_FILE_SUCCESS };
  }
}

function selectFile(file) {
  return (dispatch: Dispatch) => {
    dispatch({ type: fileActionTypes.SELECT_FILE, payload: file });
  };
}

function deselectFile(file) {
  return (dispatch: Dispatch) => {
    dispatch({ type: fileActionTypes.DESELECT_FILE, payload: file });
  };
}

function deselectAll() {
  return (dispatch: Dispatch) => {
    dispatch({ type: fileActionTypes.DESELECT_ALL });
  };
}

function setSortFunction(sortType) {
  let sortFunc = fileService.getSortFunction(sortType);
  return (dispatch: Dispatch) => {
    dispatch({
      type: fileActionTypes.SET_SORT_TYPE,
      payload: [sortType, sortFunc]
    });
  };
}

function setSearchString(searchString) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: fileActionTypes.SET_SEARCH_STRING,
      payload: searchString
    });
  };
}

function createFolder(parentFolderId, newFolderName) {
  return (dispatch: Dispatch) => {
    dispatch(request());

    fileService.createFolder(parentFolderId, newFolderName).then(
      newFolderDetails => {
        dispatch(success(newFolderDetails));
        // Refresh parent folder content (?)
        // getFolderContent(newFolderDetails.id);
      },
      error => {
        console.log('Error creating folder', error);
        dispatch(failure(error));
      }
    );
  };

  function request() {
    return { type: fileActionTypes.CREATE_FOLDER_REQUEST };
  }
  function success(newFolderDetails) {
    return {
      type: fileActionTypes.CREATE_FOLDER_SUCCESS,
      payload: newFolderDetails
    };
  }
  function failure(payload) {
    return { type: fileActionTypes.CREATE_FOLDER_FAILURE, payload };
  }
}

function moveFile(fileId, destination) {
  return (dispatch: Dispatch) => {
    dispatch(request());

    fileService.moveFile(fileId, destination).then(result => {
      if (result === 1) {
        dispatch(success());
      } else {
        console.error('Error creating folder', result);
        dispatch(failure(result));
      }
    });
  };

  function request() {
    return { type: fileActionTypes.MOVE_FILES_REQUEST };
  }
  function success() {
    return { type: fileActionTypes.MOVE_FILES_SUCCESS };
  }
  function failure(payload) {
    return { type: fileActionTypes.MOVE_FILES_FAILURE, payload };
  }
}

function updateFolderMetadata(metadata, folderId) {
  return (dispatch: Dispatch) => {
    dispatch(request());

    fileService
      .updateFolderMetadata(metadata, folderId)
      .then(() => {
        dispatch(success());
      })
      .catch(error => {
        console.error(
          `Error updating metadata on folder (${parentFolderId}): `,
          error
        );
        dispatch(failure(error));
      });
  };

  function request() {
    return { type: fileActionTypes.UPDATE_FOLDER_METADATA_REQUEST };
  }
  function success() {
    return { type: fileActionTypes.UPDATE_FOLDER_METADATA_SUCCESS };
  }
  function failure(payload) {
    return { type: fileActionTypes.UPDATE_FOLDER_METADATA_FAILURE, payload };
  }
}
