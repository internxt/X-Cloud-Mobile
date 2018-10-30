export const fileService = {
  getFiles,
  createFolder
};

function getFiles({ id = 0 }) {
  const files = filesMock.filter(f => f.parent === id);
  console.log(`Filtered by ID: ${id} and got: ${files.length} results`);
  return Promise.resolve({
    files
  });
}

function createFolder(parentFolderId, newFolderName) {
  console.log(`Creating ${newFolderName} inside folder id: ${parentFolderId}`);
  return new Promise((resolve, reject) => {
    return resolve();
  });
}

const filesMock = [
  {
    id: 1,
    parent: 0,
    name: "Presentations",
    type: "FOLDER",
    size: "20MB",
    added: 1539783819,
    style: {
      color: "purple",
      icon: ""
    }
  },
  {
    id: 2,
    parent: 0,
    name: "California Holiday",
    type: "FOLDER",
    size: "47MB",
    added: 1539783819,
    style: {
      color: "blue",
      icon: ""
    }
  },
  {
    id: 3,
    parent: 0,
    name: "Favourite Films",
    type: "FOLDER",
    size: "2000MB",
    added: 1539783819,
    style: {
      color: "pink",
      icon: ""
    }
  },
  {
    id: 4,
    parent: 0,
    name: "Salaries",
    type: "FOLDER",
    size: "20MB",
    added: 1539783819,
    style: {
      color: "yellow",
      icon: ""
    }
  },
  {
    id: 5,
    parent: 1,
    name: "Documents",
    type: "FOLDER",
    size: "20MB",
    added: 1539783819,
    items: [],
    style: {
      color: "purple",
      icon: ""
    }
  },
  {
    id: 6,
    parent: 1,
    name: "California Holiday",
    type: "FOLDER",
    size: "25MB",
    added: 1539783819,
    items: [],
    style: {
      color: "blue",
      icon: ""
    }
  },
  {
    id: 7,
    parent: 1,
    name: "Favourite Films",
    type: "FOLDER",
    size: "200MB",
    added: 1539783819,
    items: [],
    style: {
      color: "pink",
      icon: ""
    }
  },
  // TODO: Extract two components:
  // - Folder icon (props: color, icon)
  // - File icon (props: format)
  {
    id: 8,
    parent: 1,
    name: "Website Inspiration",
    type: "JPEG",
    size: "2MB",
    added: 1539783819,
    style: {
      color: "blue",
      icon: ""
    }
  }
];
