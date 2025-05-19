import { useTranslations } from 'next-intl'
import React from 'react'

function translation() {
    const t = useTranslations('HomePage');

  return (
    <>{t('title')}</>
  )
}

export default translation