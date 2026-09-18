import React from 'react';
import { CatalogScreen } from '../../src/components/CatalogScreen';

export default function CollectionsTab() {
  return (
    <CatalogScreen
      initialGenre="All"
      headerTitle="Book Collections"
      showBack={false}
    />
  );
}
