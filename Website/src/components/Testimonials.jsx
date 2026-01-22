import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import testimonials from "@/lib/data/testimonials";

const Testimonial = ({
  name,
  role,
  content,
  avatarSrc,
  className = "",
  bgColor = "bg-white dark:bg-neutral-900",
}) => {
  return (
    <div
      className={`flex flex-col justify-between p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl ${bgColor} ${className}`}
    >
      <p className="text-gray-800 dark:text-gray-200 mb-4 flex-grow">
        {content}
      </p>
      <div className="flex items-center">
        <Avatar className="h-12 w-12 mr-4">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
            {name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default function TestimonialGrid() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
          What our customers are saying
        </h2>
        <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Hear what users have to say about Pixel Track.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
        {testimonials.map((testimonial, index) => (
          <Testimonial key={index} {...testimonial} />
        ))}
      </div>
    </div>
  );
}
