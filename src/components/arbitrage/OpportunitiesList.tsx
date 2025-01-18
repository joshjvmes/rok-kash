import { Card } from "@/components/ui/card";
import { ArbitrageOpportunity as ArbitrageOpportunityComponent } from "@/components/ArbitrageOpportunity";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import type { ArbitrageOpportunity } from "@/utils/types/exchange";
import { useState } from "react";

interface OpportunitiesListProps {
  opportunities: ArbitrageOpportunity[];
  isLoading: boolean;
}

export function OpportunitiesList({ opportunities, isLoading }: OpportunitiesListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(opportunities.length / itemsPerPage);

  const getCurrentPageOpportunities = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return opportunities.slice(startIndex, endIndex);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Live Opportunities</h2>
        {isLoading ? (
          <p>Loading opportunities...</p>
        ) : opportunities.length > 0 ? (
          <>
            <div className="space-y-4">
              {getCurrentPageOpportunities().map((opportunity) => (
                <ArbitrageOpportunityComponent
                  key={`${opportunity.buyExchange}-${opportunity.sellExchange}-${opportunity.symbol}`}
                  {...opportunity}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <p>No arbitrage opportunities found</p>
        )}
      </div>
    </Card>
  );
}