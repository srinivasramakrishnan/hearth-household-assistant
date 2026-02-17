import React, { useState } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AddItemPopoverProps {
    lists: { id: string; name: string }[];
    onAddItem: (name: string, listId: string) => void;
    defaultListId?: string;
}

export const AddItemPopover = ({ lists, onAddItem, defaultListId }: AddItemPopoverProps) => {
    const [open, setOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [selectedListId, setSelectedListId] = useState(defaultListId || (lists[0]?.id || ''));

    React.useEffect(() => {
        if (open) {
            setItemName('');
            if (defaultListId) setSelectedListId(defaultListId);
        }
    }, [open, defaultListId]);

    const submitItem = () => {
        if (!itemName.trim() || !selectedListId) return;
        onAddItem(itemName, selectedListId);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full border-dashed border-slate-300 text-slate-500 hover:text-[var(--accent-olive)] hover:border-[var(--accent-olive)] hover:bg-slate-50 gap-1 px-3">
                    <Plus className="h-4 w-4" />
                    <span>Item</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Milk"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitItem(); }}
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="list">List</Label>
                        <Select value={selectedListId} onValueChange={setSelectedListId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a list" />
                            </SelectTrigger>
                            <SelectContent>
                                {lists.map((list) => (
                                    <SelectItem key={list.id} value={list.id}>
                                        {list.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={submitItem} className="w-full bg-[var(--accent-olive)] hover:bg-[var(--accent-sage)]">
                        Add Item
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

interface AddListPopoverProps {
    onAddList: (name: string) => void;
}

export const AddListPopover = ({ onAddList }: AddListPopoverProps) => {
    const [open, setOpen] = useState(false);
    const [listName, setListName] = useState('');

    React.useEffect(() => {
        if (open) {
            setListName('');
        }
    }, [open]);

    const submitList = () => {
        if (!listName.trim()) return;
        onAddList(listName);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full border-dashed border-slate-300 text-slate-500 hover:text-[var(--accent-olive)] hover:border-[var(--accent-olive)] hover:bg-slate-50 gap-1 px-3">
                    <Plus className="h-4 w-4" />
                    <span>List</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="listName">List Name</Label>
                        <Input
                            id="listName"
                            placeholder="e.g. Trader Joe's"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitList(); }}
                            autoFocus
                        />
                    </div>
                    <Button onClick={submitList} className="w-full bg-[var(--accent-olive)] hover:bg-[var(--accent-sage)]">
                        Create List
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
