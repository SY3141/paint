import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-canvas',
  standalone: true,
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasElement', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private painting = false;
  private brushColor: string = 'black';
  private brushSize: number = 5;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  changeColor(event: Event) {
    const input = event.target as HTMLInputElement;
    this.brushColor = input.value;
    if (this.ctx) {
      this.ctx.strokeStyle = this.brushColor;
    }
  }

  changeBrushSize(event: Event) {
    const input = event.target as HTMLInputElement;
    this.brushSize = Number(input.value);
    if (this.ctx) {
      this.ctx.lineWidth = this.brushSize;
    }
  }
  getBrushSize(): number {
    return this.brushSize;
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      this.resizeCanvas();
      this.addEventListeners();
    }
  }

  private addEventListeners() {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this.startPosition.bind(this));
    canvas.addEventListener('mouseup', this.endPosition.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));

    // Add touch event listeners
    canvas.addEventListener('touchstart', this.startPosition.bind(this));
    canvas.addEventListener('touchend', this.endPosition.bind(this));
    canvas.addEventListener('touchmove', this.draw.bind(this));

    // Prevent default touch actions
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  private startPosition(event: MouseEvent | TouchEvent) {
    this.painting = true;
    this.saveState(); // Save state before drawing
    this.draw(event);
  }

  private endPosition() {
    this.painting = false;
    this.ctx.beginPath(); // Reset path
  }

  private draw(event: MouseEvent | TouchEvent) {
    if (!this.painting) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    let x: number = 0;
    let y: number = 0;

    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else if (event.touches && event.touches.length > 0) {
      const touch = event.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    }

    if (this.ctx) {
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = this.brushColor;

      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    }
  }

  private saveState() {
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.undoStack.push(imageData);
    this.redoStack = []; // Clear redo stack after a new action
  }

  undo() {
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack.pop();
      if (lastState && this.ctx) {
        this.redoStack.push(this.ctx.getImageData(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height));
        this.ctx.putImageData(lastState, 0, 0);
      }
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const lastRedoState = this.redoStack.pop();
      if (lastRedoState && this.ctx) {
        this.saveState(); // Save current state to undo stack
        this.ctx.putImageData(lastRedoState, 0, 0);
      }
    }
  }

  private resizeCanvas() {
    if (isPlatformBrowser(this.platformId)) {
      const canvas = this.canvasRef.nativeElement;
      const newWidth = window.innerWidth * 0.985;
      const newHeight = window.innerHeight * 0.93;
  
      // Create a temporary canvas to save the current content
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }
  
      canvas.width = newWidth;
      canvas.height = newHeight;
  
      // Redraw the saved content onto the resized canvas
      if (this.ctx) {
        this.ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeCanvas();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'z') { // Ctrl + Z for Undo
      this.undo();
      event.preventDefault(); // Prevent default behavior
    } else if (event.ctrlKey && event.key === 'y') { // Ctrl + Y for Redo
      this.redo();
      event.preventDefault(); // Prevent default behavior
    }
  }
}
