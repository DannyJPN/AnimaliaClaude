export const journalTableDefaults = {
  enableFullScreenToggle: false,
  enableGlobalFilter: false,
  enableStickyHeader: true,
  enableDensityToggle: false,
  enableColumnOrdering: true,
  enableRowVirtualization: true,

  muiTablePaperProps: {
    className: 'rounded-none border bg-card text-card-foreground shadow-none'
  },

  muiTableHeadRowProps: {
    sx: {
      backgroundColor: 'hsl(var(--secondary))'
    }
  },

  muiTableHeadCellProps: {
    className: 'min-h-[48px]',
    sx: {
      paddingTop: '0.7rem',
      "&:focus-visible": {
        outline: '2px solid gray',
        outlineOffset: '-2px',
      }
    }
  },

  muiTableBodyCellProps: {
    sx: {
      "&:focus-visible": {
        outline: '2px solid gray',
        outlineOffset: '-2px',
      }
    }
  },

  muiTableContainerProps: {
    sx: {
      height: 'calc(100vh - 170px)'
    }
  },
};

export const printReportsTableDefaults = {
  enableFullScreenToggle: false,
  enableGlobalFilter: true,
  enableStickyHeader: true,
  enableDensityToggle: false,
  enableColumnOrdering: true,
  enableRowVirtualization: true,

  muiTablePaperProps: {
    className: 'rounded-none border bg-card text-card-foreground shadow-none'
  },

  muiTableHeadRowProps: {
    sx: {
      backgroundColor: 'hsl(var(--secondary))'
    }
  },

  muiTableHeadCellProps: {
    className: 'min-h-[48px]',
    sx: {
      paddingTop: '0.7rem',
      "&:focus-visible": {
        outline: '2px solid gray',
        outlineOffset: '-2px',
      }
    }
  },

  muiTableBodyCellProps: {
    sx: {
      "&:focus-visible": {
        outline: '2px solid gray',
        outlineOffset: '-2px',
      }
    }
  },

  muiTableContainerProps: {
    sx: {
      height: 'calc(100vh - 170px)'
    }
  },
};

