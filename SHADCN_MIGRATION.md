# Shadcn/UI Migration Guide

## Components Available

All shadcn/ui components are now available in `@/components/ui/`:

- **Button** - `@/components/ui/button`
- **Input** - `@/components/ui/input`
- **Select** - `@/components/ui/select`
- **Dialog** - `@/components/ui/dialog`
- **Card** - `@/components/ui/card`
- **Label** - `@/components/ui/label`
- **Checkbox** - `@/components/ui/checkbox`

## Migration Examples

### Before (Custom Button)
```tsx
<button
  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  onClick={handleClick}
>
  Save
</button>
```

### After (Shadcn Button)
```tsx
import { Button } from "@/components/ui/button"

<Button onClick={handleClick}>Save</Button>
```

### Before (Custom Input)
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### After (Shadcn Input)
```tsx
import { Input } from "@/components/ui/input"

<Input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Before (Custom Select)
```tsx
<select
  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
  value={value}
  onChange={(e) => setValue(e.target.value)}
>
  <option value="all">All</option>
  <option value="option1">Option 1</option>
</select>
```

### After (Shadcn Select)
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Before (Custom Modal)
```tsx
{showModal && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
    <div className="relative mx-auto p-6 border w-full max-w-sm shadow-lg rounded-xl bg-white">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Title</h3>
      {/* content */}
    </div>
  </div>
)}
```

### After (Shadcn Dialog)
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

## Button Variants

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

## Form with Label

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" type="text" />
</div>
```

## Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <label htmlFor="terms">Accept terms</label>
</div>
```

## Card Component

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Footer */}
  </CardFooter>
</Card>
```

