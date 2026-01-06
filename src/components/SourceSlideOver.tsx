'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ExternalLink, Link as LinkIcon, BookOpen, Video, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SourceSlideOverProps {
    open: boolean
    source: any
    onClose: () => void
}

export function SourceSlideOver({ open, source, onClose }: SourceSlideOverProps) {
    if (!source) return null

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-background shadow-xl">
                                        <div className="px-4 py-6 sm:px-6 border-b">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className="text-lg font-semibold text-foreground">
                                                    Source Details
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                                                        onClick={onClose}
                                                    >
                                                        <span className="absolute -inset-0.5" />
                                                        <span className="sr-only">Close panel</span>
                                                        <X className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6 space-y-6">
                                            {/* Header */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize">
                                                        {source.type}
                                                    </Badge>
                                                </div>
                                                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                                    {source.title}
                                                </h1>
                                                <p className="text-muted-foreground text-lg">
                                                    by {source.author}
                                                </p>
                                            </div>

                                            {/* Content/Description */}
                                            {source.description && (
                                                <div className="bg-muted/30 p-4 rounded-lg border">
                                                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">About this source</h3>
                                                    <p className="text-base leading-relaxed">
                                                        {source.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* URL */}
                                            {source.url && (
                                                <div className="flex items-center gap-2 p-4 bg-blue-50/5 rounded-lg border border-blue-100/10">
                                                    <ExternalLink className="h-4 w-4 text-blue-400" />
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:underline truncate flex-1"
                                                    >
                                                        {source.url}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
