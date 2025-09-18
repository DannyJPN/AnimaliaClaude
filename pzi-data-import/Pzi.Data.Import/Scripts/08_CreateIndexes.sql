-- Create clustered index for the view
CREATE UNIQUE CLUSTERED INDEX [IX_TaxonomyHierarchyView] ON [dbo].[TaxonomyHierarchyView] ([SpeciesId]);

CREATE UNIQUE CLUSTERED INDEX [IX_ExpositionHierarchyView] ON [dbo].[ExpositionHierarchyView] ([LocationId]);