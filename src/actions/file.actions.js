import { fileActionTypes } from "../constants";
import { fileService } from "../services";

export const fileActions = {
  downloadFile,
  downloadSelectedFileStart,
  downloadSelectedFileStop,
  uploadFileStart,
  uploadFileFinished,
  uploadFileFailed,
  getFolderContent,
  selectFile,
  deselectAll,
  setSortFunction,
  createFolder,
  updateFolderMetadata
};

// Will only download the current selected file defined in props
function downloadSelectedFileStart() {
  return { type: fileActionTypes.DOWNLOAD_SELECTED_FILE_START };
}

function downloadSelectedFileStop() {
  return { type: fileActionTypes.DOWNLOAD_SELECTED_FILE_STOP }
}

// TODO: Will download the file specified in the parameters.
function downloadFile(user, file) {
  return dispatch => {
    dispatch(request());

    fileService.downloadFile(user, file)
      .then((result) => {
        dispatch(success(result));
      }).catch((error) => {
        dispatch(failure(error));
      })
  }

  function request() {
    return { type: fileActionTypes.ADD_FILE_REQUEST }
  }
  function success(payload) {
    return { type: fileActionTypes.ADD_FILE_SUCCESS }
  }
  function failure(error) {
    return { type: fileActionTypes.ADD_FILE_FAILURE, error }
  }
}

function uploadFileStart(fileName) {
  return { type: fileActionTypes.ADD_FILE_REQUEST, payload: fileName }
}

function uploadFileFinished() {
  return { type: fileActionTypes.ADD_FILE_SUCCESS };
}

function uploadFileFailed() {
  return { type: fileActionTypes.ADD_FILE_FAILURE };
}

function getFolderContent(folderId) {
  const id = parseInt(folderId);
  if (isNaN(id)) {
    return dispatch => {
      dispatch(failure(`Folder ID: "${folderId}" is not a number.`));
    }
  }

  return dispatch => {
    dispatch(request());
    fileService.getFolderContent(id)
      .then(data => {
        data.currentFolder = id;
        dispatch(success(data));
      })
      .catch(error => {
        dispatch(failure(error));
      });
  };

  function request() {
    return { type: fileActionTypes.GET_FILES_REQUEST };
  }
  function success(payload) {
    return { type: fileActionTypes.GET_FILES_SUCCESS, payload };
  }
  function failure(error) {
    return { type: fileActionTypes.GET_FILES_FAILURE, error };
  }
}

function selectFile(file) {
  return dispatch => {
    dispatch({ type: fileActionTypes.SELECT_FILE, payload: file });
  };
}

function deselectAll() {
  return dispatch => {
    dispatch({ type: fileActionTypes.DESELECT_ALL });
  };
}

function setSortFunction(sortType) {
  let sortFunc = fileService.getSortFunction(sortType);
  return dispatch => {
    dispatch({ type: fileActionTypes.SET_SORT_TYPE, payload: [sortType ,sortFunc] })
  }
}

function createFolder(parentFolderId, newFolderName) {
  return dispatch => {
    dispatch(request());

    fileService.createFolder(parentFolderId, newFolderName).then(
      newFolderDetails => {
        dispatch(success(newFolderDetails));

        // Refresh parent folder content (?)
        getFolderContent(newFolderDetails.id);
      },
      error => {
        console.error("Error creating folder", error);
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
    return { type: fileActionTypes.CREATE_FOLDER_SUCCESS, payload };
  }
}

function updateFolderMetadata(metadata, folderId) {
  return dispatch => {
    dispatch(request());

    fileService.updateFolderMetadata(metadata, folderId)
      .then(() => { dispatch(success()); })
      .catch((error) => {
        console.error(`Error updating metadata on folder (${parentFolderId}): `, error);
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