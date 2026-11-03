'use client';

import * as React from 'react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
    <AccordionPrimitive.Item ref={ref} className={cn('border-b', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
                className,
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) =>
    props.forceMount ? (
        // forceMount keeps a closed item's content in the DOM (and the SSR HTML), so collapse it
        // here. Radix's keyframes need a measured height, which a collapsed element does not have,
        // and Radix sets transition-duration 0s on Content while measuring; so the inner grid
        // animates its row from 0fr to 1fr instead. `invisible` (after the transition) keeps closed
        // answers away from screen readers and tab focus.
        <AccordionPrimitive.Content ref={ref} className="group/content text-sm" {...props}>
            <div className="grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none group-data-[state=closed]/content:invisible group-data-[state=closed]/content:grid-rows-[0fr] group-data-[state=open]/content:grid-rows-[1fr]">
                <div className="min-h-0 overflow-hidden">
                    <div className={cn('pb-4 pt-0', className)}>{children}</div>
                </div>
            </div>
        </AccordionPrimitive.Content>
    ) : (
        <AccordionPrimitive.Content
            ref={ref}
            className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            {...props}
        >
            <div className={cn('pb-4 pt-0', className)}>{children}</div>
        </AccordionPrimitive.Content>
    ),
);

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
