import { useTranslations } from 'next-intl'
import React from 'react'

function translation() {
    const t = useTranslations();

  return (
    <>{t('title')}</>
  )
}

export default translation