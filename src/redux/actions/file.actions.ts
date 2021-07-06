import { Dispatch } from 'redux';
import { getLyticsData } from '../../helpers';
import analytics from '../../helpers/lytics';
import { store } from '../../store';
import { fileActionTypes } from '../constants';
import { fileService } from '../services';
import { userActions } from './user.actions';

export const fileActions = {
  downloadFileStart,
  downloadFileEnd,
  downloadSelectedFileStart,
  downloadSelectedFileStop,
  uploadFileStart,
  uploadFileFinished,
  uploadFileFailed,
  uploadFileSetProgress,
  uploadFileSetUri,
  getFolderContent,
  selectFile,
  deselectFile,
  deselectAll,
  deleteItems,
  setSortFunction,
  setSearchString,
  createFolder,
  updateFolderMetadata,
  moveFile,
  setRootFolderContent,
  setUri,
  addUploadingFile,
  addUploadedFile,
  removeUploadingFile,
  removeUploadedFile,
  fetchIfSameFolder,
  updateUploadingFile
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

function uploadFileStart() {
  return { type: fileActionTypes.ADD_FILE_REQUEST };
}

function addUploadingFile(file: any) {
  return { type: fileActionTypes.ADD_UPLOADING_FILE, payload: file };
}

function addUploadedFile(file: any) {
  return { type: fileActionTypes.ADD_UPLOADED_FILE, payload: file };
}

function removeUploadingFile(id: string) {
  return { type: fileActionTypes.REMOVE_UPLOADING_FILE, payload: id };
}

function removeUploadedFile(id: string) {
  return { type: fileActionTypes.REMOVE_UPLOADED_FILE, payload: id };
}

function uploadFileFinished(name: string) {
  return { type: fileActionTypes.ADD_FILE_SUCCESS, payload: name };
}

function uploadFileFailed(id: string) {
  return { type: fileActionTypes.ADD_FILE_FAILURE, payload: id };
}

function uploadFileSetProgress(progress: number, id: string) {
  const payload = { progress, id }

  return { type: fileActionTypes.ADD_FILE_UPLOAD_PROGRESS, payload };
}

function uploadFileSetUri(uri: string | undefined) {
  return { type: fileActionTypes.SET_FILE_UPLOAD_URI, payload: uri };
}

function fetchIfSameFolder(fileFolder: number) {
  return (dispatch: Dispatch) => {
    const currentFoder = store.getState().filesState.folderContent.currentFolder

    if (fileFolder === currentFoder) {
      dispatch(getFolderContent(currentFoder))
    }
  }
}

function getFolderContent(folderId: string) {
  const id = parseInt(folderId)

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
      }).catch(error => {
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
        }, 3000);
      })
      .catch((err) => {
        dispatch(requestFailure());
        setTimeout(() => {
          dispatch(getFolderContent(folderToReload));
        }, 3000);
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

function selectFile(file: any) {
  return (dispatch: Dispatch) => {
    dispatch({ type: fileActionTypes.SELECT_FILE, payload: file });
  };
}

function deselectFile(file: any) {
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
  const sortFunc = fileService.getSortFunction(sortType);

  return (dispatch: Dispatch) => {
    dispatch({
      type: fileActionTypes.SET_SORT_TYPE,
      payload: [sortType, sortFunc]
    });
  };
}

function setSearchString(searchString: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: fileActionTypes.SET_SEARCH_STRING,
      payload: searchString
    });
  };
}

function createFolder(parentFolderId: number, newFolderName: string) {
  return (dispatch: Dispatch) => {
    dispatch(request());

    fileService.createFolder(parentFolderId, newFolderName).then(
      (newFolderDetails: any) => {
        dispatch(success(newFolderDetails));
        dispatch(getFolderContent(parentFolderId + ''))
      },
      error => {
        dispatch(failure(error));
      }
    );
  };

  function request() {
    return { type: fileActionTypes.CREATE_FOLDER_REQUEST };
  }
  function success(newFolderDetails: any) {
    (async () => {
      const userData = await getLyticsData()

      analytics.track('folder-created', {
        userId: userData.uuid,
        platform: 'mobile',
        email: userData.email
      }).catch(() => { })
    })()
    return {
      type: fileActionTypes.CREATE_FOLDER_SUCCESS,
      payload: newFolderDetails
    };
  }
  function failure(payload: any) {
    return { type: fileActionTypes.CREATE_FOLDER_FAILURE, payload };
  }
}

function moveFile(fileId: string, destination: string) {
  return (dispatch: Dispatch) => {
    dispatch(request());
    fileService.moveFile(fileId, destination).then(result => {
      dispatch(fileActions.getFolderContent(destination))
      if (result === 1) {
        dispatch(success());
      } else {
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
  function failure(payload: any) {
    return { type: fileActionTypes.MOVE_FILES_FAILURE, payload };
  }
}

function setRootFolderContent(folderContent: any) {
  return { type: fileActionTypes.SET_ROOTFOLDER_CONTENT, payload: folderContent }
}

function setUri(uri: string | Record<string, string> | undefined | null) {
  if (uri) {
    getLyticsData().then(user => {
      analytics.track('share-to', {
        email: user.email,
        uri: uri.fileUri ? uri.fileUri : uri.toString && uri.toString()
      }).catch(() => {
      });
    }).catch(() => {
    });
  }
  return { type: fileActionTypes.SET_URI, payload: uri }
}

function updateFolderMetadata(metadata: any, folderId) {
  return (dispatch: Dispatch) => {
    dispatch(request());

    fileService
      .updateFolderMetadata(metadata, folderId)
      .then(() => {
        dispatch(success());
      })
      .catch(error => {
        dispatch(failure(error));
      });
  };

  function request() {
    return { type: fileActionTypes.UPDATE_FOLDER_METADATA_REQUEST };
  }
  function success() {
    return { type: fileActionTypes.UPDATE_FOLDER_METADATA_SUCCESS };
  }
  function failure(payload: any) {
    return { type: fileActionTypes.UPDATE_FOLDER_METADATA_FAILURE, payload };
  }
}

function updateUploadingFile(id: string) {
  return { type: fileActionTypes.UPDATE_UPLOADING_FILE, payload: id };
}