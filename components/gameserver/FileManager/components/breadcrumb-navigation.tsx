"use client"

import React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { BreadcrumbNavigationProps } from "../../../../models/file-manager"

export function BreadcrumbNavigation({ currentPath, onNavigate }: BreadcrumbNavigationProps) {
  const parts = currentPath.split("/").filter(Boolean)

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => onNavigate("/")}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              Root
            </BreadcrumbLink>
          </BreadcrumbItem>

          {parts.map((part, index) => {
            const path = `/${parts.slice(0, index + 1).join("/")}/`
            return (
              <React.Fragment key={path}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => onNavigate(path)}
                    className="cursor-pointer hover:text-primary transition-colors"
                  >
                    {part}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
